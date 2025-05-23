import { ApiProperty } from '@nestjs/swagger';

export class GetSessionContextRequest {
  @ApiProperty()
  contexts: Array<{ contextId: number; value: number }>;
}
