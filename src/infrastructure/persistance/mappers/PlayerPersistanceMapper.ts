import { Injectable } from '@nestjs/common';
import Player from '../../../domain/aggregates/Player';
import { Player as PlayerModel } from '../models/PlayerSchema';

@Injectable()
export default class PlayerPersistanceMapper {
  public mapToDataModel(player: Player): PlayerModel {
    const base64_settings = player.getSettingsStringArray();

    return {
      xuid: player.xuid.value,
      gamertag: player.gamertag?.value,
      settings: base64_settings,
      hostAddress: player.hostAddress.value,
      machineId: player.machineId.value,
      macAddress: player.macAddress.value,
      port: player.port,
      sessionId: player.sessionId?.value,
      updatedAt: new Date(),
      titleId: player.titleId?.toString(),
      state: player.state?.value,
      richPresence: player.richPresence?.toString(),
    };
  }
}
