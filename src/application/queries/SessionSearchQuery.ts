import TitleId from 'src/domain/value-objects/TitleId';
import Xuid from 'src/domain/value-objects/Xuid';

export class SessionSearchQuery {
  constructor(
    public readonly title: TitleId,
    public readonly searcher_xuid: Xuid,
    public readonly searchIndex: number,
    public readonly resultsCount: number,
    public readonly numUsers: number,
    public readonly filters: Array<string>,
  ) {}
}
