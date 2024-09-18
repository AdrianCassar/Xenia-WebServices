import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import { GetPlayersQuery } from '../queries/GetPlayersQuery';

@QueryHandler(GetPlayersQuery)
export class GetPlayersQueryHandler implements IQueryHandler<GetPlayersQuery> {
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
  ) {}

  async execute(query: GetPlayersQuery) {
    return this.repository.findByXuids(query.xuids);
  }
}
