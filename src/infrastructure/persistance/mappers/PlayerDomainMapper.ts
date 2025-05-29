import { Player as PlayerModel } from '../models/PlayerSchema';
import Player from '../../../domain/aggregates/Player';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import IpAddress from 'src/domain/value-objects/IpAddress';
import Xuid from 'src/domain/value-objects/Xuid';
import MacAddress from 'src/domain/value-objects/MacAddress';
import SessionId from 'src/domain/value-objects/SessionId';
import Gamertag from 'src/domain/value-objects/Gamertag';
import TitleId from 'src/domain/value-objects/TitleId';
import StateFlag, { StateFlags } from 'src/domain/value-objects/StateFlag';

@Injectable()
export default class PlayerDomainMapper {
  constructor(private readonly logger: ConsoleLogger) {}

  public mapToDomainModel(player: PlayerModel): Player {
    // Define default values for a player

    let xuid: Xuid = new Xuid('0'.repeat(16));
    let hostAddress: IpAddress = new IpAddress('0.0.0.0');
    let macAddress: MacAddress = new MacAddress('002212345678');
    let machineId: Xuid = new Xuid('FA00002212345678');
    let port: number = 0;
    let gamertag: Gamertag = new Gamertag('Xenia User');
    let sessionId: SessionId = new SessionId('0'.repeat(16));
    let titleId: TitleId = new TitleId('0');
    let state: StateFlag = new StateFlag(
      StateFlags.ONLINE | StateFlags.JOINABLE | StateFlags.PLAYING,
    );
    let richPresence: string = '';

    try {
      if (player?.xuid) {
        xuid = new Xuid(player.xuid);
      }

      if (player?.gamertag) {
        gamertag = new Gamertag(player.gamertag);
      }

      if (player?.hostAddress) {
        hostAddress = new IpAddress(player.hostAddress);
      }

      if (player?.macAddress) {
        macAddress = new MacAddress(player.macAddress);
      }

      if (player?.machineId) {
        machineId = new Xuid(player.machineId);
      }

      if (player?.port) {
        port = player.port;
      }

      if (player?.sessionId) {
        sessionId = new SessionId(player.sessionId.toString());
      }

      if (player?.titleId) {
        titleId = new TitleId(player.titleId.toString());
      }

      if (player?.state) {
        state = new StateFlag(player.state);
      }

      if (player?.richPresence) {
        richPresence = player.richPresence;
      }
    } catch (error) {
      this.logger.fatal(error);
    }

    return new Player({
      xuid: xuid,
      gamertag: gamertag,
      hostAddress: hostAddress,
      macAddress: macAddress,
      machineId: machineId,
      port: port,
      sessionId: sessionId,
      titleId: titleId,
      state: state,
      richPresence: richPresence,
    });
  }
}
