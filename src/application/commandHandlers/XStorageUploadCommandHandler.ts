import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { XStorageUploadCommand } from '../commands/XStorageUploadCommand';
import { existsSync } from 'fs';
import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { ConsoleLogger, PayloadTooLargeException } from '@nestjs/common';

export enum UploadState {
  Error = -1,
  Uploaded = 0,
  Not_Modified = 1,
}

@CommandHandler(XStorageUploadCommand)
export class XStorageUploadCommandHandler
  implements ICommandHandler<XStorageUploadCommand>
{
  constructor(private readonly logger: ConsoleLogger) {}

  async execute(command: XStorageUploadCommand): Promise<number> {
    const dir_path = path.parse(command.path);

    const buffer_size = command.buffer.byteLength;

    if (buffer_size > command.buffer_size_limit) {
      throw new PayloadTooLargeException(
        `${dir_path.name} of size ${buffer_size}b exceeds maximum size of ${command.buffer_size_limit}b.`,
      );
    }

    let result = UploadState.Uploaded;

    if (!existsSync(dir_path.dir)) {
      try {
        await mkdir(dir_path.dir, { recursive: true });
      } catch {
        result = UploadState.Error;
      }
    }

    try {
      if (existsSync(command.path)) {
        const file_buffer = await readFile(command.path);

        if (file_buffer.compare(command.buffer) == 0) {
          result = UploadState.Not_Modified;
        }
      } else {
        await writeFile(command.path, command.buffer);
        result = UploadState.Uploaded;
      }
    } catch {
      result = UploadState.Error;
    }

    return result;
  }
}
