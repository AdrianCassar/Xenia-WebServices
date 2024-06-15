import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import Xuid from 'src/domain/value-objects/Xuid';
import Gamertag from 'src/domain/value-objects/Gamertag';

export class CreatePlayerCommand {
  constructor(
    public readonly xuid: Xuid,
    public readonly gamertag: Gamertag,
    public readonly machineId: Xuid,
    public readonly hostAddress: IpAddress,
    public readonly macAddress: MacAddress,
  ) {}
}
