import Property from 'src/domain/value-objects/Property';
import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';

export class AddSessionPropertyCommand {
  constructor(
    public readonly titleId: TitleId,
    public readonly sessionId: SessionId,
    public readonly properties: Array<Property>,
  ) {}
}
