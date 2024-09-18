import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import ILeaderboardRepository, {
  ILeaderboardRepositorySymbol,
} from 'src/domain/repositories/ILeaderboardRepository';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import { FindLeaderboardsResponse } from 'src/infrastructure/presentation/responses/FindLeaderboardsResponse';
import { FindLeaderboardsQuery } from '../queries/FindLeaderboardsQuery';

@QueryHandler(FindLeaderboardsQuery)
export class FindLeaderboardsQueryHandler
  implements IQueryHandler<FindLeaderboardsQuery>
{
  constructor(
    @Inject(ILeaderboardRepositorySymbol)
    private repository: ILeaderboardRepository,
    @Inject(IPlayerRepositorySymbol)
    private repository2: IPlayerRepository,
  ) {}

  async execute(
    query: FindLeaderboardsQuery,
  ): Promise<FindLeaderboardsResponse> {
    const res: FindLeaderboardsResponse = [];
    await Promise.all(
      query.leaderboard.map(async (leaderboardQuery) => {
        const leaderboardResponse: FindLeaderboardsResponse[0] = {
          id: parseInt(leaderboardQuery.id.value),
          players: [],
        };
        await Promise.all(
          query.players.map(async (player) => {
            const user = await this.repository2.findByXuid(player);
            const leaderboard = await this.repository.findLeaderboard(
              query.titleId,
              leaderboardQuery.id,
              player,
            );

            const stats: FindLeaderboardsResponse[0]['players'][0]['stats'] =
              [];
            const acceptedStatIds = leaderboardQuery.statisticIds.map(
              (stat) => stat.value,
            );

            let foundStatIds: string[] = [];

            if (leaderboard) {
              foundStatIds = Object.keys(leaderboard.stats);

              Object.entries(leaderboard.stats).forEach(([statId, stat]) => {
                if (acceptedStatIds.includes(statId)) {
                  stats.push({
                    id: parseInt(statId),
                    type: stat.type,
                    value: stat.value,
                  });
                }
              });
            }

            // add missing stats as null.
            const missingStatIds = acceptedStatIds.filter(
              (acceptedStatId) => !foundStatIds.includes(acceptedStatId),
            );

            missingStatIds.forEach((missingStatId) => {
              stats.push({
                id: parseInt(missingStatId),
                type: 255,
                value: 0,
              });
            });

            leaderboardResponse.players.push({
              xuid: player.value,
              gamertag: user?.gamertag?.value
                ? user.gamertag.value
                : 'Xenia User',
              stats,
            });
          }),
        );
        if (leaderboardResponse.players.length > 0)
          res.push(leaderboardResponse);
      }),
    );

    return res;
  }
}
