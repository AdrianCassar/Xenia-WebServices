import { ApiProperty } from '@nestjs/swagger';

export class XStorageEnumerateRequest {
  @ApiProperty({ default: 50, required: true })
  MaxItems: number;
}
