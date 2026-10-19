import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardColumnResponseDto {
  @ApiProperty()
  attribute_id: number;

  @ApiProperty({ description: 'Base64 serialized XUSER_PROPERTY' })
  property: string;
}

export class LeaderboardRowResponseDto {
  @ApiProperty()
  xuid: string;

  @ApiProperty({ type: [LeaderboardColumnResponseDto] })
  columns: LeaderboardColumnResponseDto[];
}

export class LeaderboardViewResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Total number of rows in the leaderboard' })
  total_rows: number;

  @ApiProperty({ type: [LeaderboardRowResponseDto] })
  rows: LeaderboardRowResponseDto[];
}

export class LeaderboardsResponseDto {
  @ApiProperty()
  title_id: string;

  @ApiProperty({ type: [LeaderboardViewResponseDto] })
  views: LeaderboardViewResponseDto[];
}

export class EstimateRankResponseDto {
  @ApiProperty()
  ranks: number[];
}
