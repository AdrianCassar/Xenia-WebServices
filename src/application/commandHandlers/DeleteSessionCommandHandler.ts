import { ConsoleLogger, Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import Session from 'src/domain/aggregates/Session';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import {
  DeleteSessionCommand,
  DeleteSessionsCommand,
} from '../commands/DeleteSessionCommand';

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionCommandHandler
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(DeleteSessionCommandHandler.name);
  }

  async execute(command: DeleteSessionCommand) {
    const session = await this.repository.findSession(
      command.title,
      command.sessionId,
    );

    if (!session) {
      return undefined;
    }

    await this.deleteSession(session);

    return session;
  }

  async deleteSession(session: Session) {
    if (!session) {
      return undefined;
    }

    session.delete();
    await this.repository.save(session);

    const qosPath = join(
      process.cwd(),
      'qos',
      session.titleId.toString(),
      session.id.value,
    );

    if (existsSync(qosPath)) {
      await unlink(qosPath);
    }

    this.logger.debug(`Soft Deleted Session: ${session.id.value}`);

    return session;
  }
}

@CommandHandler(DeleteSessionsCommand)
export class DeleteSessionsCommandHandler
  implements ICommandHandler<DeleteSessionsCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(DeleteSessionsCommand.name);
  }

  async execute(command: DeleteSessionsCommand) {
    let msg = 'Deleting all session(s) from ' + command.hostAddress.value;

    if (command.macAddress) {
      msg += ' - ' + command.macAddress.value.toString();
    }

    this.logger.debug(msg);

    const sessions = await this.repository.findSessionsByIPAndMac(
      command.hostAddress,
      command.macAddress,
    );

    if (sessions) {
      await this.repository.deleteSessions(sessions);
    }

    return sessions;
  }
}
