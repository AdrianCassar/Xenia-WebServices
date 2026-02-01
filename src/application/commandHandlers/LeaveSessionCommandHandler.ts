import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { LeaveSessionCommand } from '../commands/LeaveSessionCommand';

@CommandHandler(LeaveSessionCommand)
export class LeaveSessionCommandHandler implements ICommandHandler<LeaveSessionCommand> {
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute(command: LeaveSessionCommand) {
    const session = await this.repository.findSession(
      command.titleId,
      command.sessionId,
    );

    if (!session) {
      return undefined;
    }

    session.leave({
      xuids: command.xuids,
    });

    await this.repository.save(session);

    return session;
  }
}
