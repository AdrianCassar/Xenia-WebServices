import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  IPlayersStatsRepository,
  IPlayersStatsSymbol,
} from 'src/domain/repositories/IPlayersStatsRepository';
import { EstimateRankResponseDto } from 'src/infrastructure/persistance/dtos/LeaderboardsResponseDto';
import { EstimateRankQuery } from '../queries/EstimateRankQuery';

@QueryHandler(EstimateRankQuery)
export class EstimateRankQueryHandler implements IQueryHandler<EstimateRankQuery> {
  constructor(
    @Inject(IPlayersStatsSymbol)
    private readonly repository: IPlayersStatsRepository,
  ) {}

  async execute(query: EstimateRankQuery): Promise<EstimateRankResponseDto> {
    return this.repository.estimateRank(query.request);
  }
}
