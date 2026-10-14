import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlayersStatsRepository,
  IPlayersStatsSymbol,
} from 'src/domain/repositories/IPlayersStatsRepository';
import { WriteStatsCommand } from '../commands/WriteStatsCommand';

@CommandHandler(WriteStatsCommand)
export class WriteStatsCommandHandler implements ICommandHandler<WriteStatsCommand> {
  constructor(
    @Inject(IPlayersStatsSymbol)
    private readonly repository: IPlayersStatsRepository,
  ) {}

  async execute(command: WriteStatsCommand): Promise<void> {
    return this.repository.write(command.stats);
  }
}
