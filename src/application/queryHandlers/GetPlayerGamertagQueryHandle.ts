import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import { GetPlayerGamertagQuery } from '../queries/GetPlayerGamertagQuery';

@QueryHandler(GetPlayerGamertagQuery)
export class GetPlayerGamertagQueryHandler
  implements IQueryHandler<GetPlayerGamertagQuery>
{
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
  ) {}

  async execute(query: GetPlayerGamertagQuery) {
    return this.repository.findByGamertag(query.gamertag);
  }
}
