import { ConsoleLogger } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { XStorageBuildServerPathCommand } from '../commands/XStorageBuildServerPathCommand';

export enum BuildServerPathState {
  Error = -1,
  Created = 0,
  Found = 1,
}

@CommandHandler(XStorageBuildServerPathCommand)
export class XStorageBuildServerPathCommandHandler
  implements ICommandHandler<XStorageBuildServerPathCommand>
{
  constructor(private readonly logger: ConsoleLogger) {}

  async execute(
    command: XStorageBuildServerPathCommand,
  ): Promise<BuildServerPathState> {
    if (!existsSync(command.absolute_path)) {
      const created_dir = await mkdir(command.absolute_path, {
        recursive: true,
      });

      if (!created_dir) {
        return BuildServerPathState.Error;
      }
    } else {
      return BuildServerPathState.Found;
    }

    return BuildServerPathState.Created;
  }
}
