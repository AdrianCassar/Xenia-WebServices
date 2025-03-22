import { ApiProperty } from '@nestjs/swagger';

export class FindUsersInfoRequest {
  @ApiProperty()
  UsersInfo: Array<[string, string]>; // xuid, gamertag
}
