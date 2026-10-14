import {
  EnumerateLeaderboardsDto,
  EstimateRankDto,
  ReadLeaderboardsDto,
} from 'src/infrastructure/persistance/dtos/ReadLeaderboardsDto';
import {
  EstimateRankResponseDto,
  LeaderboardsResponseDto,
} from 'src/infrastructure/persistance/dtos/LeaderboardsResponseDto';
import { WriteStatsDto } from 'src/infrastructure/persistance/dtos/WriteStatsDto';

export const IPlayersStatsSymbol = Symbol('IPlayersStatsRepository');

export interface IPlayersStatsRepository {
  write(stats: WriteStatsDto): Promise<void>;
  read(request: ReadLeaderboardsDto): Promise<LeaderboardsResponseDto>;
  enumerate(
    request: EnumerateLeaderboardsDto,
  ): Promise<LeaderboardsResponseDto>;
  estimateRank(request: EstimateRankDto): Promise<EstimateRankResponseDto>;
}
