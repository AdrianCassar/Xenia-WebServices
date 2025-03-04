import Gamertag from 'src/domain/value-objects/Gamertag';

export class GetPlayerGamertagQuery {
  constructor(public readonly gamertag: Gamertag) {}
}
