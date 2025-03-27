import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { XStorageDeleteCommand } from '../commands/XStorageDeleteCommand';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

@CommandHandler(XStorageDeleteCommand)
export class XStorageDeleteCommandHandler
  implements ICommandHandler<XStorageDeleteCommand>
{
  constructor() {}

  async execute(command: XStorageDeleteCommand) {
    if (existsSync(command.path)) {
      await unlink(command.path);
    }
  }
}
