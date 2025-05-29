import { ApiProperty } from '@nestjs/swagger';

export class PresenceUpdateRequest {
  @ApiProperty()
  xuid: string;
  @ApiProperty()
  state: number;
  @ApiProperty()
  sessionID: string;
  @ApiProperty()
  titleID: string;
  @ApiProperty()
  userTime: number;
  @ApiProperty()
  richPresence: string;
  @ApiProperty()
  richPresenceSize: number;
}

export class PresencesUpdateRequest {
  @ApiProperty()
  presence: Array<PresenceUpdateRequest>;
}
