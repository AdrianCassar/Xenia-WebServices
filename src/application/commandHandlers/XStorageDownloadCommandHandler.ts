import {
  HttpException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common/exceptions';
import path from 'path';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { stat } from 'fs/promises';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { createReadStream, existsSync } from 'fs';
import { XStorageDownloadCommand } from '../commands/XStorageDownloadCommand';

@CommandHandler(XStorageDownloadCommand)
export class XStorageDownloadCommandHandler
  implements ICommandHandler<XStorageDownloadCommand>
{
  constructor() {}

  async execute(command: XStorageDownloadCommand): Promise<boolean> {
    const dir_path = path.parse(command.path);

    if (!existsSync(command.path)) {
      throw new HttpException('No Content', HttpStatus.NO_CONTENT);
    }

    const stats = await stat(command.path);

    if (!stats.isFile()) {
      throw new NotFoundException(`File at ${command.path} not found.`);
    }

    if (stats.size > command.buffer_size_limit) {
      throw new PayloadTooLargeException(
        `${dir_path.name} of size ${stats.size}b exceeds maximum size of ${command.buffer_size_limit}b.`,
      );
    }

    command.response.set('Content-Creation-Time', stats.birthtimeMs.toString());
    command.response.set('Content-Length', stats.size.toString());
    const stream = createReadStream(command.path);
    stream.pipe(command.response);

    return true;
  }
}
