import {
  ConsoleLogger,
  Controller,
  Get,
  Header,
  Param,
  Res,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { join } from 'path';
import { Response } from 'express';
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';

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
  async getTitleServers(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = join(
      process.cwd(),
      './src/titles',
      titleId.toUpperCase(),
      'servers.json',
    );

    if (!existsSync(path)) {
      return [];
    }

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());

    const file = await readFile(path);

    return file.toString('utf8');
  }

  @Get('/services')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitleService(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = join(
      process.cwd(),
      './src/titles',
      titleId.toUpperCase(),
      'services.json',
    );

    if (!existsSync(path)) {
      return [];
    }

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());

    const file = await readFile(path);

    return file.toString('utf8');
  }

  @Get('/ports')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitlePorts(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = join(
      process.cwd(),
      './src/titles',
      titleId.toUpperCase(),
      'ports.json',
    );

    if (!existsSync(path)) {
      return {};
    }

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());

    const file = await readFile(path);

    return file.toString('utf8');
  }
}
