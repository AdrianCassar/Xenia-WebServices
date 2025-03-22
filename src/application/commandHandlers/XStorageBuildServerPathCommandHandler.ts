import { ConsoleLogger } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { XStorageBuildServerPathCommand } from '../commands/XStorageBuildServerPathCommand';

@CommandHandler(XStorageBuildServerPathCommand)
export class XStorageBuildServerPathCommandHandler
  implements ICommandHandler<XStorageBuildServerPathCommand>
{
  constructor(private readonly logger: ConsoleLogger) {}

  async execute(command: XStorageBuildServerPathCommand): Promise<number> {
    if (!existsSync(command.absolute_path)) {
      const created_dir = await mkdir(command.absolute_path, {
        recursive: true,
      });

      if (!created_dir) {
        return -1; // Failed
      }
    } else {
      return 1; // Found
    }

    return 0; // Created
  }
}
