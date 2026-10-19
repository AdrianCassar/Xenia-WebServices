import { EnumerateLeaderboardsDto } from 'src/infrastructure/persistence/dtos/ReadLeaderboardsDto';

export class EnumerateLeaderboardsQuery {
  constructor(public readonly request: EnumerateLeaderboardsDto) {}
}
