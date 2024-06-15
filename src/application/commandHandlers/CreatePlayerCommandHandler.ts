import { Inject } from '@nestjs/common';
import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import Player from 'src/domain/aggregates/Player';
import IPlayerRepository, {
  IPlayerRepositorySymbol,
} from 'src/domain/repositories/IPlayerRepository';
import {
  Session,
  SessionDocument,
} from 'src/infrastructure/persistance/models/SessionSchema';
import { CreatePlayerCommand } from '../commands/CreatePlayerCommand';

@CommandHandler(CreatePlayerCommand)
export class CreatePlayerCommandHandler
  implements ICommandHandler<CreatePlayerCommand>
{
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
    @InjectModel(Session.name)
    private SessionModel: Model<SessionDocument>,
  ) {}

  async execute(command: CreatePlayerCommand) {
    await this.repository.save(
      Player.create({
        xuid: command.xuid,
        gamertag: command.gamertag,
        hostAddress: command.hostAddress,
        macAddress: command.macAddress,
        machineId: command.machineId,
      }),
    );
  }
}
