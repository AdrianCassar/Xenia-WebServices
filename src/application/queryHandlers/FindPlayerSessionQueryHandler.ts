import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import ISessionRepository, {
  ISessionRepositorySymbol,
} from 'src/domain/repositories/ISessionRepository';
import { FindPlayerSessionQuery } from '../queries/FindPlayerSessionQuery';

@QueryHandler(FindPlayerSessionQuery)
export class FindPlayerSessionQueryHandler implements IQueryHandler<FindPlayerSessionQuery> {
  constructor(
    @Inject(ISessionRepositorySymbol)
    private repository: ISessionRepository,
  ) {}

  async execute(query: FindPlayerSessionQuery) {
    return this.repository.findByPlayer(query.xuid);
  }
}
