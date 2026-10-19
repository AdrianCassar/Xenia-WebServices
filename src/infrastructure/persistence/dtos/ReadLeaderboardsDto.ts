import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardSpecDto {
  @ApiProperty()
  view_id: number;

  @ApiProperty({ description: 'Column attribute ids in requested order' })
  column_ids: number[];
}

// XUserReadStats
export class ReadLeaderboardsDto {
  @ApiProperty()
  title_id: string;

  @ApiProperty()
  players: string[];

  @ApiProperty({ type: [LeaderboardSpecDto] })
  leaderboards: LeaderboardSpecDto[];
}

export enum EnumerateLeaderboardsType {
  Xuid = 'xuid',
  Rank = 'rank',
  Rating = 'rating',
}

// XUserCreateStatsEnumeratorByXuid/ByRank/ByRating
export class EnumerateLeaderboardsDto {
  @ApiProperty()
  title_id: string;

  @ApiProperty({ enum: EnumerateLeaderboardsType })
  type: EnumerateLeaderboardsType;

  @ApiPropertyOptional({ description: 'Pivot player for xuid enumeration' })
  xuid?: string;

  @ApiPropertyOptional({ description: '1-based start rank' })
  rank?: number;

  @ApiPropertyOptional({ description: 'Signed 64-bit rating as string' })
  rating?: string;

  @ApiProperty()
  num_rows: number;

  @ApiProperty({ type: [LeaderboardSpecDto] })
  leaderboards: LeaderboardSpecDto[];
}

export class EstimateRankRequestDto {
  @ApiProperty()
  view_id: number;

  @ApiProperty({ description: 'Signed 64-bit rating as string' })
  rating: string;
}

// XUserEstimateRankForRating
export class EstimateRankDto {
  @ApiProperty()
  title_id: string;

  @ApiProperty({ type: [EstimateRankRequestDto] })
  requests: EstimateRankRequestDto[];
}
