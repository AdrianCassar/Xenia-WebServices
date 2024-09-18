import { ApiProperty } from '@nestjs/swagger';

export class PresenceRequest {
  @ApiProperty()
  xuids: string[];
}
