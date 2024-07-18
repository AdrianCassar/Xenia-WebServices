import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';
import SessionFlags from 'src/domain/value-objects/SessionFlags';
import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';
import Xuid from 'src/domain/value-objects/Xuid';

export class CreateSessionCommand {
  constructor(
    public readonly titleId: TitleId,
    public readonly xuid: Xuid,
    public readonly title: string,
    public readonly mediaId: string,
    public readonly version: string,
    public readonly sessionId: SessionId,
    public readonly hostAddress: IpAddress,
    public readonly flags: SessionFlags,
    public readonly publicSlotsCount: number,
    public readonly privateSlotsCount: number,
    public readonly macAddress: MacAddress,
    public readonly port: number,
  ) {}
}
