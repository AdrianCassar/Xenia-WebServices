import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import Session from 'src/domain/aggregates/Session';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { CreateSessionCommand } from '../commands/CreateSessionCommand';

@CommandHandler(CreateSessionCommand)
export class CreateSessionCommandHandler
  implements ICommandHandler<CreateSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute(command: CreateSessionCommand) {
    const session = Session.create({
      id: command.sessionId,
      xuid: command.xuid,
      titleId: command.titleId,
      title: command.title,
      mediaId: command.mediaId,
      version: command.version,
      flags: command.flags,
      hostAddress: command.hostAddress,
      publicSlotsCount: command.publicSlotsCount,
      privateSlotsCount: command.privateSlotsCount,
      macAddress: command.macAddress,
      port: command.port,
    });

    await this.repository.save(session);

    return session;
  }
}
