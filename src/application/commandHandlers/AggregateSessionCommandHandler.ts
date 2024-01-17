import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { AggregateSessionCommand } from '../commands/AggregateSessionCommand';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import Session from 'src/domain/aggregates/Session';

@CommandHandler(AggregateSessionCommand)
export class AggregateSessionCommandHandler
  implements ICommandHandler<AggregateSessionCommand>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute() {
    const sessions = await this.repository.findAllAdvertisedSessions();

    const titles = {};

    titles['Titles'] = [];

    sessions.forEach((session: Session) => {
      const titleId = session.titleId.toString();

      let index = titles['Titles'].findIndex(
        (title) => title.titleId === titleId,
      );

      if (index == -1) {
        const data = {
          titleId: titleId,
          name: session.title,
          sessions: [],
        };

        titles['Titles'].push(data);

        index = titles['Titles'].length - 1;
      }

      const data = {
        mediaId: session.mediaId,
        version: session.version,
        players: session.players.length,
      };

      titles['Titles'][index]['sessions'].push(data);
    });

    return JSON.stringify(titles);
  }
}
