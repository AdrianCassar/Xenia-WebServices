import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AggregationType } from 'src/domain/value-objects/Property';
import { LeaderboardResetType } from 'src/domain/value-objects/LeaderboardResetType';

export class WriteStatsColumnDto {
  @ApiProperty()
  attribute_id: number;

  @ApiProperty({ enum: AggregationType })
  aggregation_type: AggregationType;

  @ApiProperty({ description: 'Base64 serialized XUSER_PROPERTY' })
  property: string;
}

export class WriteStatsRowDto {
  @ApiProperty()
  xuid: string;

  @ApiProperty({ type: [WriteStatsColumnDto] })
  columns: WriteStatsColumnDto[];
}

export class WriteStatsViewDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({
    enum: LeaderboardResetType,
    description: 'XLast resetType, defaults to Never',
  })
  reset_type?: string;

  @ApiProperty({ type: [WriteStatsRowDto] })
  rows: WriteStatsRowDto[];
}

export class WriteStatsDto {
  @ApiProperty()
  title_id: string;

  @ApiProperty({ type: [WriteStatsViewDto] })
  views: WriteStatsViewDto[];
}
