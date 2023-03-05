import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import ILeaderboardRepository, { ILeaderboardRepositorySymbol } from 'src/domain/repositories/ILeaderboardRepository';
import { FindLeaderboardsResponse } from 'src/infrastructure/presentation/responses/FindLeaderboardsResponse';
import { FindLeaderboardsQuery } from '../queries/FindLeaderboardsQuery';

@QueryHandler(FindLeaderboardsQuery)
export class FindLeaderboardsQueryHandler
  implements IQueryHandler<FindLeaderboardsQuery>
{
  constructor(
    @Inject(ILeaderboardRepositorySymbol)
    private repository: ILeaderboardRepository,
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
            const leaderboard = await this.repository.findLeaderboard(
              query.titleId,
              leaderboardQuery.id,
              player,
            );
            if (!leaderboard) return;
            const stats: FindLeaderboardsResponse[0]['players'][0]['stats'] = [];
            const acceptedStatIds = leaderboardQuery.statisticIds.map(
              (stat) => stat.value,
            );
            Object.entries(leaderboard.stats).forEach(([statId, stat]) => {
              if (acceptedStatIds.includes(statId)) {
                stats.push({
                  id: parseInt(statId),
                  type: stat.type,
                  value: stat.value,
                });
              }
            });
            leaderboardResponse.players.push({
              xuid: player.value,
              gamertag: '',
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
