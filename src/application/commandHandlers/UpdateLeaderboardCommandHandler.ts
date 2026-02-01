import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import Leaderboard from 'src/domain/aggregates/Leaderboard';
import ILeaderboardRepository, {
  ILeaderboardRepositorySymbol,
} from 'src/domain/repositories/ILeaderboardRepository';
import { UpdateLeaderboardCommand } from '../commands/UpdateLeaderboardCommand';

@CommandHandler(UpdateLeaderboardCommand)
export class UpdateLeaderboardCommandHandler implements ICommandHandler<UpdateLeaderboardCommand> {
  constructor(
    @Inject(ILeaderboardRepositorySymbol)
    private repository: ILeaderboardRepository,
  ) {}

  async execute(command: UpdateLeaderboardCommand) {
    let leaderboard = await this.repository.findLeaderboard(
      command.titleId,
      command.leaderboardId,
      command.player,
    );

    if (!leaderboard) {
      leaderboard = new Leaderboard({
        id: command.leaderboardId,
        titleId: command.titleId,
        player: command.player,
        stats: command.stats,
      });
    } else {
      leaderboard.update({
        stats: command.stats,
      });
    }

    await this.repository.save(leaderboard);
  }
}
