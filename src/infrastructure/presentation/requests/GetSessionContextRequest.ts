import { ApiProperty } from "@nestjs/swagger";

export class GetSessionContextRequest {
  @ApiProperty()
  contexts: Map<number, {contextId: number, value: number}>;
}