import SessionId from 'src/domain/value-objects/SessionId';
import TitleId from 'src/domain/value-objects/TitleId';

export class AddSessionPropertyCommand {
  constructor(
    public readonly titleId: TitleId,
    public readonly sessionId: SessionId,
    public readonly properties: Map<
      number,
      { propertyId: number; value: number }
    >,
  ) {}
}
