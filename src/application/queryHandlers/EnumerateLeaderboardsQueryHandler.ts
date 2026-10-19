import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IPlayersStatsRepository,
  IPlayersStatsSymbol,
} from 'src/domain/repositories/IPlayersStatsRepository';
import { LeaderboardsResponseDto } from 'src/infrastructure/persistence/dtos/LeaderboardsResponseDto';
import { EnumerateLeaderboardsQuery } from '../queries/EnumerateLeaderboardsQuery';

@QueryHandler(EnumerateLeaderboardsQuery)
export class EnumerateLeaderboardsQueryHandler implements IQueryHandler<EnumerateLeaderboardsQuery> {
  constructor(
    @Inject(IPlayersStatsSymbol)
    private readonly repository: IPlayersStatsRepository,
  ) {}

  async execute(
    query: EnumerateLeaderboardsQuery,
  ): Promise<LeaderboardsResponseDto> {
    return this.repository.enumerate(query.request);
  }
}
