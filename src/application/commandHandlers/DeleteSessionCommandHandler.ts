import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import Session from 'src/domain/aggregates/Session';
import ISessionRepository, { ISessionRepositorySymbol } from 'src/domain/repositories/ISessionRepository';
import { DeleteSessionCommand, DeleteSessionsCommand } from '../commands/DeleteSessionCommand';

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionCommandHandler
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) { }

  async execute(command: DeleteSessionCommand) {
    const session = await this.repository.findSession(
      command.title,
      command.sessionId,
    );

    this.deleteSession(session);
  }

  async deleteSession(session: Session) {
    if (session) {
      session.delete();
      this.repository.save(session);

      const qosPath = join(
        process.cwd(),
        'qos',
        session.titleId.toString(),
        session.id.value,
      );

      if (existsSync(qosPath)) {
        await unlink(qosPath);

        console.log("Deleted session: " + session.id.value);
      }
    }
  }
}

@CommandHandler(DeleteSessionsCommand)
export class DeleteSessionsCommandHandler
  implements ICommandHandler<DeleteSessionsCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) { }

  async execute(command: DeleteSessionsCommand) {
    let msg = "Deleting all session(s) from " + command.hostAddress.value;

    if (command.macAddress) {
      msg += " - " + command.macAddress.value.toString();
    }

    console.log(msg);

    const sessions = await this.repository.findSessionsByIPAndMac(
      command.hostAddress,
      command.macAddress
    );

    await this.repository.deleteSessions(sessions);
  }
}