import { ApiProperty } from '@nestjs/swagger';

export class GetSessionPropertyRequest {
  @ApiProperty()
  properties: Map<number, { propertyId: number; value: number }>;
}
