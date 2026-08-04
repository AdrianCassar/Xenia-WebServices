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
import OnlineAddressAllocator from 'src/infrastructure/persistance/services/OnlineAddressAllocator';
import { CreatePlayerCommand } from '../commands/CreatePlayerCommand';

@CommandHandler(CreatePlayerCommand)
export class CreatePlayerCommandHandler implements ICommandHandler<CreatePlayerCommand> {
  constructor(
    @Inject(IPlayerRepositorySymbol)
    private repository: IPlayerRepository,
    @InjectModel(Session.name)
    private SessionModel: Model<SessionDocument>,
    private readonly onlineAddressAllocator: OnlineAddressAllocator,
  ) {}

  async execute(command: CreatePlayerCommand): Promise<Player> {
    const existing = await this.repository.findByXuid(command.xuid);
    let onlineAddress = existing?.onlineAddress;
    if (!onlineAddress) {
      onlineAddress = await this.onlineAddressAllocator.allocate();
    }

    return await this.repository.save(
      Player.create({
        xuid: command.xuid,
        gamertag: command.gamertag,
        hostAddress: command.hostAddress,
        onlineAddress,
        macAddress: command.macAddress,
        machineId: command.machineId,
        settings: command.settings,
      }),
    );
  }
}
