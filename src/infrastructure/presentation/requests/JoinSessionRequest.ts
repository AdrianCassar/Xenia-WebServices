import { ApiProperty } from '@nestjs/swagger';

export class JoinSessionRequest {
  @ApiProperty()
  xuids: string[];
  @ApiProperty()
  privateSlots: boolean[];
}
