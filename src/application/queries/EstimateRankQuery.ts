import { EstimateRankDto } from 'src/infrastructure/persistance/dtos/ReadLeaderboardsDto';

export class EstimateRankQuery {
  constructor(public readonly request: EstimateRankDto) {}
}
