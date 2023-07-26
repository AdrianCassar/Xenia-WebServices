import { ApiProperty } from "@nestjs/swagger";

class WriteStatsRequestLeaderboardStatistic {
  @ApiProperty()
  type: number;
  @ApiProperty()
  value: number;
}

class WriteStatsRequestLeaderboard {
  @ApiProperty()
  stats: {
    [propertyId: string]: WriteStatsRequestLeaderboardStatistic
  }
}

export class WriteStatsRequest {
  @ApiProperty()
  xuid: string;
  @ApiProperty()
  leaderboards: {
    [leaderboardId: string]: WriteStatsRequestLeaderboard
  }
}
