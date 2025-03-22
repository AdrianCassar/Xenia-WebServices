import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { XStorageUploadCommand } from '../commands/XStorageUploadCommand';
import { existsSync } from 'fs';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { ConsoleLogger, PayloadTooLargeException } from '@nestjs/common';

@CommandHandler(XStorageUploadCommand)
export class XStorageUploadCommandHandler
  implements ICommandHandler<XStorageUploadCommand>
{
  constructor(private readonly logger: ConsoleLogger) {}

  async execute(command: XStorageUploadCommand): Promise<boolean> {
    const dir_path = path.parse(command.path);

    const buffer_size = command.buffer.byteLength;

    if (buffer_size > command.buffer_size_limit) {
      throw new PayloadTooLargeException(
        `${dir_path.name} of size ${buffer_size}b exceeds maximum size of ${command.buffer_size_limit}b.`,
      );
    }

    if (!existsSync(dir_path.dir)) {
      await mkdir(dir_path.dir, { recursive: true });
    }

    await writeFile(command.path, command.buffer);

    return true;
  }
}
