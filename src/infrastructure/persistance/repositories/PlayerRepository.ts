import { Model } from 'mongoose';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import IPlayerRepository from 'src/domain/repositories/IPlayerRepository';
import Player from 'src/domain/aggregates/Player';
import PlayerDomainMapper from '../mappers/PlayerDomainMapper';
import PlayerPersistanceMapper from '../mappers/PlayerPersistanceMapper';
import { PlayerDocument } from '../models/PlayerSchema';
import Xuid from 'src/domain/value-objects/Xuid';
import IpAddress from 'src/domain/value-objects/IpAddress';
import Gamertag from 'src/domain/value-objects/Gamertag';

@Injectable()
export default class PlayerRepository implements IPlayerRepository {
  constructor(
    private readonly logger: ConsoleLogger,
    @InjectModel(Player.name)
    private PlayerModel: Model<PlayerDocument>,
    private readonly playerDomainMapper: PlayerDomainMapper,
    private readonly playerPersistanceMapper: PlayerPersistanceMapper,
  ) {
    this.logger.setContext(PlayerRepository.name);
  }

  public async save(player: Player) {
    await this.PlayerModel.findOneAndUpdate(
      {
        xuid: player.xuid.value,
      },
      this.playerPersistanceMapper.mapToDataModel(player),
      {
        upsert: true,
        new: true,
      },
    );
  }

  public async findByXuids(xuids: Xuid[]): Promise<Player[]> {
    const player_xuids: string[] = xuids.map((_xuid: Xuid) => {
      return _xuid.value;
    });

    const players_docs = await this.PlayerModel.find({
      xuid: player_xuids,
    });

    const players: Player[] = players_docs.map((document) => {
      return this.playerDomainMapper.mapToDomainModel(document);
    });

    return players;
  }

  public async findByXuid(xuid: Xuid): Promise<Player> {
    if (!xuid) {
      return undefined;
    }

    const player = await this.PlayerModel.findOne({
      xuid: xuid.value,
    });

    if (!player) {
      return undefined;
    }

    return this.playerDomainMapper.mapToDomainModel(player);
  }

  public async findByAddress(ip: IpAddress): Promise<Player> {
    const player = await this.PlayerModel.findOne({
      hostAddress: ip.value,
    });

    if (!player) {
      return undefined;
    }

    return this.playerDomainMapper.mapToDomainModel(player);
  }

  public async DeleteAllMyProfilesByAddress(ip: IpAddress): Promise<Player[]> {
    const players_docs = await this.PlayerModel.find({
      hostAddress: ip.value,
    });

    const players: Player[] = players_docs.map((document) => {
      return this.playerDomainMapper.mapToDomainModel(document);
    });

    await this.PlayerModel.deleteMany({
      hostAddress: ip.value,
    });

    return players;
  }

  public async findByGamertag(gamertag: Gamertag): Promise<Player> {
    const player = await this.PlayerModel.findOne({
      gamertag: gamertag.value,
    });

    return this.playerDomainMapper.mapToDomainModel(player);
  }
}
