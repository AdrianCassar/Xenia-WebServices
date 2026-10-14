import { EnumerateLeaderboardsDto } from 'src/infrastructure/persistance/dtos/ReadLeaderboardsDto';

export class EnumerateLeaderboardsQuery {
  constructor(public readonly request: EnumerateLeaderboardsDto) {}
}
