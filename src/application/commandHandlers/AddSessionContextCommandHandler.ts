import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import ISessionRepository, { ISessionRepositorySymbol } from 'src/domain/repositories/ISessionRepository';
import { AddSessionContextCommand } from '../commands/AddSessionContextCommand';

@CommandHandler(AddSessionContextCommand)
export class AddSessionContextCommandHandler
  implements ICommandHandler<AddSessionContextCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute(command: AddSessionContextCommand) {
    const session = await this.repository.findSession(command.titleId, command.sessionId);

    session.addContext({context: command.contexts});
    await this.repository.save(session);
  }
}
