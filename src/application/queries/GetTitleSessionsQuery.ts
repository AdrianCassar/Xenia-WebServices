import TitleId from 'src/domain/value-objects/TitleId';

export class GetTitleSessionsQuery {
  constructor(public readonly title: TitleId) {}
}
