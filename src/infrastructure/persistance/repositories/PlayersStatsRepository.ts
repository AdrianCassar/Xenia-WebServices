import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPlayersStatsRepository } from 'src/domain/repositories/IPlayersStatsRepository';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import Property, {
  AggregationType,
  XProperty,
} from 'src/domain/value-objects/Property';
import Xuid from 'src/domain/value-objects/Xuid';
import {
  getNextLeaderboardReset,
  parseLeaderboardResetType,
} from 'src/domain/value-objects/LeaderboardResetType';
import {
  PlayerStats,
  PlayerStatsDocument,
  StatsColumn,
} from '../models/PlayerStatsSchema';
import { WriteStatsDto } from '../dtos/WriteStatsDto';
import {
  EnumerateLeaderboardsDto,
  EnumerateLeaderboardsType,
  EstimateRankDto,
  LeaderboardSpecDto,
  ReadLeaderboardsDto,
} from '../dtos/ReadLeaderboardsDto';
import {
  EstimateRankResponseDto,
  LeaderboardColumnResponseDto,
  LeaderboardRowResponseDto,
  LeaderboardsResponseDto,
  LeaderboardViewResponseDto,
} from '../dtos/LeaderboardsResponseDto';

// System Attribute Ids
export const RankAttributeId: number = 0xffff;
export const RatingAttributeId: number = 0xfffe;
export const GamertagAttributeId: number = 0xfffd;
export const AttachmentSizeAttributeId: number = 0xfffa;

// X_STATS_MAX_ROW_COUNT
const kMaxRowCount: number = 100;
const kDefaultGamertag: string = 'Xenia User';

// Rows are ordered by rating descending, ties are resolved by insertion order.
const kLeaderboardSort = { rating: -1, _id: 1 } as const;

@Injectable()
export class PlayersStatsRepository implements IPlayersStatsRepository {
  constructor(
    @InjectModel(PlayerStats.name)
    private readonly playerStatsModel: Model<PlayerStatsDocument>,
    @Inject(IPlayerRepositorySymbol)
    private readonly playerRepository: IPlayerRepository,
    private readonly logger: ConsoleLogger,
  ) {
    this.logger.setContext(PlayersStatsRepository.name);
  }

  async write(stats: WriteStatsDto): Promise<void> {
    const title_id = stats.title_id.toUpperCase();

    const xuids: string[] = stats.views.flatMap((view) =>
      (view.rows ?? []).map((row) => row.xuid.toUpperCase()),
    );

    const gamertags = await this.getGamertags(xuids);

    const now = new Date();

    for (const view of stats.views) {
      const expires_at = getNextLeaderboardReset(
        parseLeaderboardResetType(view.reset_type),
        now,
      );

      for (const row of view.rows ?? []) {
        const xuid = row.xuid.toUpperCase();

        let document = await this.playerStatsModel.findOne({
          title_id: title_id,
          view_id: view.id,
          xuid: xuid,
        });

        // Row is from a previous period that MongoDB has not removed yet.
        if (document && this.isExpired(document, now)) {
          await document.deleteOne();
          document = null;
        }

        if (!document) {
          document = new this.playerStatsModel({
            title_id: title_id,
            view_id: view.id,
            xuid: xuid,
            gamertag: kDefaultGamertag,
            rating: 0n,
            columns: [],
          });
        }

        const columns = new Map<number, Property>();

        for (const column of document.columns) {
          columns.set(column.attribute_id, new Property(column.property));
        }

        for (const column of row.columns ?? []) {
          // Rank and gamertag are derived when reading.
          if (
            column.attribute_id === RankAttributeId ||
            column.attribute_id === GamertagAttributeId
          ) {
            continue;
          }

          let incoming: Property;

          try {
            incoming = new Property(column.property);
          } catch {
            this.logger.warn(
              `Invalid property for column ${column.attribute_id} in view ${view.id}`,
            );
            continue;
          }

          const existing = columns.get(column.attribute_id);

          columns.set(
            column.attribute_id,
            existing
              ? Property.aggregate(
                  existing,
                  incoming,
                  column.aggregation_type ?? AggregationType.Last,
                )
              : incoming,
          );
        }

        const rating = columns.get(RatingAttributeId);

        document.columns = Array.from(columns.entries()).map(
          ([attribute_id, property]): StatsColumn => ({
            attribute_id: attribute_id,
            property: property.toBase64(),
          }),
        );
        document.rating = rating ? rating.getInt64Value() : 0n;
        document.gamertag = gamertags.get(xuid) ?? document.gamertag;
        document.expires_at = expires_at;

        await document.save();
      }
    }
  }

  async read(request: ReadLeaderboardsDto): Promise<LeaderboardsResponseDto> {
    const title_id = request.title_id.toUpperCase();

    const players: string[] = Array.from(
      new Set(request.players.map((xuid) => xuid.toUpperCase())),
    );

    const gamertags = await this.getGamertags(players);

    const views: LeaderboardViewResponseDto[] = [];

    for (const spec of request.leaderboards) {
      const filter = this.viewFilter(title_id, spec.view_id);

      const documents = await this.playerStatsModel.find({
        ...filter,
        xuid: { $in: players },
      });

      const rows: LeaderboardRowResponseDto[] = [];

      // Return a row for every requested player, players without stats
      // are not ranked.
      for (const xuid of players) {
        const document = documents.find((doc) => doc.xuid === xuid);
        const rank = document ? await this.getRank(document) : 0;

        rows.push(
          this.buildRow(
            xuid,
            gamertags.get(xuid) ?? document?.gamertag ?? kDefaultGamertag,
            rank,
            document,
            spec,
          ),
        );
      }

      views.push({
        id: spec.view_id,
        total_rows: await this.playerStatsModel.countDocuments(filter),
        rows: rows,
      });
    }

    return { title_id: title_id, views: views };
  }

  async enumerate(
    request: EnumerateLeaderboardsDto,
  ): Promise<LeaderboardsResponseDto> {
    const title_id = request.title_id.toUpperCase();
    const num_rows = Math.min(Math.max(request.num_rows ?? 1, 1), kMaxRowCount);

    const views: LeaderboardViewResponseDto[] = [];

    for (const spec of request.leaderboards) {
      const filter = this.viewFilter(title_id, spec.view_id);
      const total_rows = await this.playerStatsModel.countDocuments(filter);

      const start = await this.getEnumerationStart(
        request,
        spec,
        num_rows,
        total_rows,
      );

      const documents: PlayerStatsDocument[] =
        start === undefined
          ? []
          : await this.playerStatsModel
              .find(filter)
              .sort(kLeaderboardSort)
              .skip(start)
              .limit(num_rows);

      const gamertags = await this.getGamertags(
        documents.map((doc) => doc.xuid),
      );

      views.push({
        id: spec.view_id,
        total_rows: total_rows,
        rows: documents.map((document, index) =>
          this.buildRow(
            document.xuid,
            gamertags.get(document.xuid) ?? document.gamertag,
            (start ?? 0) + index + 1,
            document,
            spec,
          ),
        ),
      });
    }

    return { title_id: title_id, views: views };
  }

  async estimateRank(
    request: EstimateRankDto,
  ): Promise<EstimateRankResponseDto> {
    const title_id = request.title_id.toUpperCase();

    const ranks: number[] = [];

    for (const rank_request of request.requests) {
      const ahead = await this.playerStatsModel.countDocuments({
        ...this.viewFilter(title_id, rank_request.view_id),
        rating: { $gt: this.parseRating(rank_request.rating) },
      });

      ranks.push(ahead + 1);
    }

    return { ranks: ranks };
  }

  // Helper Methods

  // Index of the first row to return, undefined if there are no rows.
  private async getEnumerationStart(
    request: EnumerateLeaderboardsDto,
    spec: LeaderboardSpecDto,
    num_rows: number,
    total_rows: number,
  ): Promise<number | undefined> {
    switch (request.type) {
      case EnumerateLeaderboardsType.Rank: {
        return Math.max((request.rank ?? 1) - 1, 0);
      }
      case EnumerateLeaderboardsType.Rating: {
        // Start from the first row with a rating less than or equal to pivot.
        return await this.playerStatsModel.countDocuments({
          ...this.viewFilter(request.title_id.toUpperCase(), spec.view_id),
          rating: { $gt: this.parseRating(request.rating) },
        });
      }
      case EnumerateLeaderboardsType.Xuid: {
        if (!request.xuid) {
          return undefined;
        }

        const pivot = await this.playerStatsModel.findOne({
          ...this.viewFilter(request.title_id.toUpperCase(), spec.view_id),
          xuid: request.xuid.toUpperCase(),
        });

        // Pivot player isn't on the leaderboard.
        if (!pivot) {
          return undefined;
        }

        // Center rows around the pivot player.
        const pivot_index = (await this.getRank(pivot)) - 1;
        const start = pivot_index - Math.floor(num_rows / 2);

        return Math.max(Math.min(start, total_rows - num_rows), 0);
      }
      default: {
        this.logger.warn(`Unknown enumeration type: ${request.type}`);
        return undefined;
      }
    }
  }

  private async getRank(document: PlayerStatsDocument): Promise<number> {
    const ahead = await this.playerStatsModel.countDocuments({
      ...this.viewFilter(document.title_id, document.view_id),
      $or: [
        { rating: { $gt: document.rating } },
        { rating: document.rating, _id: { $lt: document._id } },
      ],
    });

    return ahead + 1;
  }

  // Rows of a view. Expired rows from views that reset are removed by MongoDB
  // within about a minute of expiring, they are not filtered here so ranking
  // can be counted from the index alone.
  private viewFilter(title_id: string, view_id: number) {
    return { title_id: title_id, view_id: view_id };
  }

  private isExpired(document: PlayerStatsDocument, now: Date): boolean {
    return !!document.expires_at && document.expires_at <= now;
  }

  // Columns are returned in the requested order, columns without data are
  // omitted and left for the client to fill.
  private buildRow(
    xuid: string,
    gamertag: string,
    rank: number,
    document: PlayerStatsDocument | null | undefined,
    spec: LeaderboardSpecDto,
  ): LeaderboardRowResponseDto {
    const columns: LeaderboardColumnResponseDto[] = [];

    for (const column_id of new Set(spec.column_ids)) {
      switch (column_id) {
        case RankAttributeId: {
          if (document) {
            columns.push({
              attribute_id: column_id,
              property: Property.fromInt32(XProperty.RANK, rank).toBase64(),
            });
          }
          break;
        }
        case GamertagAttributeId: {
          columns.push({
            attribute_id: column_id,
            property: Property.fromUTF16(
              XProperty.GAMERNAME,
              gamertag,
            ).toBase64(),
          });
          break;
        }
        default: {
          const column = document?.columns.find(
            (column) => column.attribute_id === column_id,
          );

          if (column) {
            columns.push({
              attribute_id: column.attribute_id,
              property: column.property,
            });
          }
        }
      }
    }

    return { xuid: xuid, columns: columns };
  }

  private async getGamertags(xuids: string[]): Promise<Map<string, string>> {
    const valid_xuids: Xuid[] = [];

    for (const xuid of new Set(xuids)) {
      try {
        valid_xuids.push(new Xuid(xuid));
      } catch {
        this.logger.warn(`Invalid XUID: ${xuid}`);
      }
    }

    const gamertags = new Map<string, string>();

    if (!valid_xuids.length) {
      return gamertags;
    }

    const players = await this.playerRepository.findByXuids(valid_xuids);

    for (const player of players) {
      if (player.gamertag?.value) {
        gamertags.set(player.xuid.value, player.gamertag.value);
      }
    }

    return gamertags;
  }

  private parseRating(rating: string | undefined): bigint {
    try {
      return Property.clampInt64(BigInt(rating ?? 0));
    } catch {
      this.logger.warn(`Invalid rating: ${rating}`);
      return 0n;
    }
  }
}
