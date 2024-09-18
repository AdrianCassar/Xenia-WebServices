import Player from 'src/domain/aggregates/Player';
import Xuid from 'src/domain/value-objects/Xuid';

export class UpdatePlayerCommand {
  constructor(
    public readonly xuid: Xuid,
    public readonly player: Player,
  ) {}
}
