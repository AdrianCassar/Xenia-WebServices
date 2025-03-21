import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { GetTitleSessionsQuery } from '../queries/GetTitleSessionsQuery';

@QueryHandler(GetTitleSessionsQuery)
export class GetTitleSessionsQueryHandler
  implements IQueryHandler<GetTitleSessionsQuery>
{
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute(query: GetTitleSessionsQuery) {
    return this.repository.findTitleSessions(query.title);
  }
}
