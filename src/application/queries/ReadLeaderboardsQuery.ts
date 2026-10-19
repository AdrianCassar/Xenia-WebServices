import { ReadLeaderboardsDto } from 'src/infrastructure/persistence/dtos/ReadLeaderboardsDto';

export class ReadLeaderboardsQuery {
  constructor(public readonly request: ReadLeaderboardsDto) {}
}
