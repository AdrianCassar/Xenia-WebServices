import { ApiProperty } from '@nestjs/swagger';

export class MigrateSessionRequest {
  @ApiProperty()
  xuid: string;
  @ApiProperty()
  hostAddress: string;
  @ApiProperty({ required: false })
  localAddress?: string;
  @ApiProperty()
  macAddress: string;
  @ApiProperty()
  port: number;
}
