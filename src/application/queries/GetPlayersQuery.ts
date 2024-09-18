import Xuid from 'src/domain/value-objects/Xuid';

export class GetPlayersQuery {
  constructor(public readonly xuids: Array<Xuid>) {}
}
