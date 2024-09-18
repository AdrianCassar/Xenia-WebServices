import Player from '../aggregates/Player';
import IpAddress from '../value-objects/IpAddress';
import Xuid from '../value-objects/Xuid';

export default interface IPlayerRepository {
  findByXuid: (xuid: Xuid) => Promise<Player | undefined>;
  findByXuids: (xuid: Xuid[]) => Promise<Player[] | undefined>;
  findByAddress: (hostAddress: IpAddress) => Promise<Player | undefined>;
  save: (player: Player) => Promise<void>;
}

export const IPlayerRepositorySymbol = Symbol('IPlayerRepository');
