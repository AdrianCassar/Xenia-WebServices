import { ApiProperty } from '@nestjs/swagger';

export class SettingsUpdateRequest {
  @ApiProperty()
  settings: Map<string, Map<string, Array<string>>>;
}
