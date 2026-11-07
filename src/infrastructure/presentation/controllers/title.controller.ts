import { ConsoleLogger, Controller, Get, Header, Param } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import TitleId from 'src/domain/value-objects/TitleId';

@ApiTags('Title')
@Controller('/title/:titleId')
export class TitleController {
  constructor(
    private readonly logger: ConsoleLogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    this.logger.setContext(TitleController.name);
  }

  @Get('/servers')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitleServers(@Param('titleId') titleId: string) {
    return this.readTitleFile(titleId, 'servers.json', []);
  }

  @Get('/services')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitleService(@Param('titleId') titleId: string) {
    return this.readTitleFile(titleId, 'services.json', []);
  }

  @Get('/ports')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitlePorts(@Param('titleId') titleId: string) {
    return this.readTitleFile(titleId, 'ports.json', {});
  }

  private async readTitleFile(
    titleId: string,
    fileName: string,
    fallback: object,
  ) {
    // Keeps the ID from reaching outside src/titles.
    if (!TitleId.isValidValue(titleId)) {
      return fallback;
    }

    const path = join(
      process.cwd(),
      './src/titles',
      new TitleId(titleId).toString(),
      fileName,
    );

    if (!existsSync(path)) {
      return fallback;
    }

    return readFile(path, 'utf8');
  }
}
