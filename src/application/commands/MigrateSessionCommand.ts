import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';
import Xuid from 'src/domain/value-objects/Xuid';

export class MigrateSessionCommand {
  constructor(
    public readonly titleId: TitleId,
    public readonly sessionId: SessionId,
    public readonly xuid: Xuid,
    public readonly hostAddress: IpAddress,
    public readonly macAddress: MacAddress,
    public readonly port: number,
    public readonly localAddress?: IpAddress,
  ) {}
}
