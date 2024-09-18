import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import { UpdatePlayerCommand } from '../commands/UpdatePlayerCommand';

@CommandHandler(UpdatePlayerCommand)
export class UpdatePlayerCommandHandler
  implements ICommandHandler<UpdatePlayerCommand>
{
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
  ) {}

  async execute(command: UpdatePlayerCommand) {
    const player = await this.repository.findByXuid(command.xuid);

    if (!player) {
      return undefined;
    }

    player.updatePlayer(command.player);
    await this.repository.save(player);
  }
}
