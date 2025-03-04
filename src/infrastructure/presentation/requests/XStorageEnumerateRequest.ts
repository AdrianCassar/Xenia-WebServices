import { ApiProperty } from '@nestjs/swagger';

export class XStorageEnumerateRequest {
  @ApiProperty()
  MaxItems: number;
}
