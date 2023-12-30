import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';

export class DeleteSessionCommand {
  constructor(
    public readonly title: TitleId,
    public readonly sessionId: SessionId,
  ) { }
}

export class DeleteSessionsCommand {
  constructor(
    public readonly hostAddress: IpAddress,
    public readonly macAddress?: MacAddress,
  ) { }
}