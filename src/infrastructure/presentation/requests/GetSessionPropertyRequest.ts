import { ApiProperty } from '@nestjs/swagger';

export class GetSessionPropertyRequest {
  @ApiProperty()
  properties: Array<string>;
}
