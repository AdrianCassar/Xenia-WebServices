import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IPlayersStatsRepository,
  IPlayersStatsSymbol,
} from 'src/domain/repositories/IPlayersStatsRepository';
import { LeaderboardsResponseDto } from 'src/infrastructure/persistance/dtos/LeaderboardsResponseDto';
import { ReadLeaderboardsQuery } from '../queries/ReadLeaderboardsQuery';

@QueryHandler(ReadLeaderboardsQuery)
export class ReadLeaderboardsQueryHandler implements IQueryHandler<ReadLeaderboardsQuery> {
  constructor(
    @Inject(IPlayersStatsSymbol)
    private readonly repository: IPlayersStatsRepository,
  ) {}

  async execute(
    query: ReadLeaderboardsQuery,
  ): Promise<LeaderboardsResponseDto> {
    return this.repository.read(query.request);
  }
}
