import { ConsoleLogger, Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { SessionSearchQuery } from '../queries/SessionSearchQuery';

@QueryHandler(SessionSearchQuery)
export class SessionSearchQueryHandler
  implements IQueryHandler<SessionSearchQuery>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
    private readonly logger: ConsoleLogger,
  ) {
    logger.setContext(SessionSearchQuery.name);
  }

  async execute(query: SessionSearchQuery) {
    this.logger.debug('Session Search ' + query.searchIndex);

    return this.repository.findAdvertisedSessions(
      query.title,
      query.resultsCount,
      query.numUsers,
    );
  }
}
