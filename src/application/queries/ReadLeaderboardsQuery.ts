import { ReadLeaderboardsDto } from 'src/infrastructure/persistance/dtos/ReadLeaderboardsDto';

export class ReadLeaderboardsQuery {
  constructor(public readonly request: ReadLeaderboardsDto) {}
}
