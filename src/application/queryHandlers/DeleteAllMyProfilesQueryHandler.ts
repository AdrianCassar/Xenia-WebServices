import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import { DeleteMyProfilesQuery } from '../queries/DeleteMyProfilesQuery';

@QueryHandler(DeleteMyProfilesQuery)
export class DeleteMyProfilesQueryHandler
  implements IQueryHandler<DeleteMyProfilesQuery>
{
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
  ) {}

  async execute(query: DeleteMyProfilesQuery) {
    return this.repository.DeleteAllMyProfilesByAddress(query.hostAddress);
  }
}
