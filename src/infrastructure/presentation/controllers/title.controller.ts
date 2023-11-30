import {
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { join } from 'path';
import { Response } from 'express';
import { stat } from 'fs/promises';
import { createReadStream, existsSync } from 'fs';

@ApiTags('Title')
@Controller('/title/:titleId')
export class TitleController {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/servers')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @Header('content-type', 'application/json')
  async getTitleServers(
    @Param('titleId') titleId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = join(
      process.cwd(),
      'titles',
      titleId.toUpperCase(),
      'servers.json',
    );

    if (!existsSync(path)) return [];

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());
    return new StreamableFile(createReadStream(path)).setErrorHandler(
      err => {
        console.log("Error requesting servers.json: " + err.message);
      }
    );
  }

  @Get('/services/:serviceId')
  @ApiParam({ name: 'titleId', example: '4D5307E6' })
  @ApiParam({ name: 'serviceId', example: '45410004' })
  @Header('content-type', 'application/json')
  async getTitleService(
    @Param('titleId') titleId: string,
    @Param('serviceId') serviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const path = join(
      process.cwd(),
      'titles',
      titleId.toUpperCase(),
      "services",
      `${serviceId}.json`
    );

    if (!existsSync(path)) return [];

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());
    return new StreamableFile(createReadStream(path)).setErrorHandler(
      err => {
        console.log(`Error requesting ${serviceId}.json: ` + err.message);
      }
    );
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
      'titles',
      titleId.toUpperCase(),
      'ports.json',
    );

    if (!existsSync(path)) return {};

    const stats = await stat(path);

    res.set('Content-Length', stats.size.toString());
    var ports = new StreamableFile(createReadStream(path))
    .setErrorHandler(
      err => {
        console.log("Error requesting ports.json: " + err.message);
      }
    );

    return ports;
  }
}
