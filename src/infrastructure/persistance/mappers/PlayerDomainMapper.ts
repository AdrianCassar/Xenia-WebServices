import { Player as PlayerModel } from '../models/PlayerSchema';
import Player from '../../../domain/aggregates/Player';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import IpAddress from 'src/domain/value-objects/IpAddress';
import Xuid from 'src/domain/value-objects/Xuid';
import MacAddress from 'src/domain/value-objects/MacAddress';
import SessionId from 'src/domain/value-objects/SessionId';
import Gamertag from 'src/domain/value-objects/Gamertag';

@Injectable()
export default class PlayerDomainMapper {
  constructor(private readonly logger: ConsoleLogger) {}

  public mapToDomainModel(player: PlayerModel): Player {
    return new Player({
      xuid: new Xuid(player.xuid),
      gamertag: new Gamertag(player.gamertag),
      hostAddress: new IpAddress(player.hostAddress),
      macAddress: new MacAddress(player.macAddress),
      machineId: new Xuid(player.machineId),
      port: player.port,
      sessionId: player.sessionId ? new SessionId(player.sessionId) : undefined,
    });
  }
}
