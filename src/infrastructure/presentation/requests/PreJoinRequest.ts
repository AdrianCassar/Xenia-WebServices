import { ApiProperty } from '@nestjs/swagger';

export class PreJoinRequest {
  @ApiProperty()
  xuids: string[];
}
