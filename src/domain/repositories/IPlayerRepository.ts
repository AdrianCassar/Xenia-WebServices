import Player from '../aggregates/Player';
import IpAddress from '../value-objects/IpAddress';
import Xuid from '../value-objects/Xuid';
import Gamertag from 'src/domain/value-objects/Gamertag';

export default interface IPlayerRepository {
  findByXuid: (xuid: Xuid) => Promise<Player | undefined>;
  findByXuids: (xuid: Xuid[]) => Promise<Player[] | undefined>;
  findByAddress: (hostAddress: IpAddress) => Promise<Player | undefined>;
  findByGamertag: (gamertag: Gamertag) => Promise<Player | undefined>;
  save: (player: Player) => Promise<void>;
}

export const IPlayerRepositorySymbol = Symbol('IPlayerRepository');
