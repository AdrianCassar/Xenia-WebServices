import { EstimateRankDto } from 'src/infrastructure/persistence/dtos/ReadLeaderboardsDto';

export class EstimateRankQuery {
  constructor(public readonly request: EstimateRankDto) {}
}
