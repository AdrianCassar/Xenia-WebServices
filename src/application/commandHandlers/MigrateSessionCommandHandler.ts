import { ConsoleLogger, Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import Session from 'src/domain/aggregates/Session';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { MigrateSessionCommand } from '../commands/MigrateSessionCommand';

@CommandHandler(MigrateSessionCommand)
export class MigrateSessionCommandHandler implements ICommandHandler<MigrateSessionCommand> {
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(MigrateSessionCommand.name);
  }

  async execute(command: MigrateSessionCommand) {
    this.logger.verbose('\n' + JSON.stringify(command, null, 2));

    const session = await this.repository.findSession(
      command.titleId,
      command.sessionId,
    );

    if (session.migration) {
      return await this.repository.findSession(
        command.titleId,
        session.migration,
      );
    }

    const newSession = Session.createMigration({
      session,
      xuid: command.xuid,
      hostAddress: command.hostAddress,
      macAddress: command.macAddress,
      port: command.port,
    });

    session.delete();

    await this.repository.save(newSession);
    await this.repository.save(session);

    return newSession;
  }
}
