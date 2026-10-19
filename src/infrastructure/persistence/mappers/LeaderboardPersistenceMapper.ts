import { Injectable } from '@nestjs/common';
import Leaderboard from '../../../domain/aggregates/Leaderboard';
import { Leaderboard as LeaderboardModel } from '../models/LeaderboardSchema';

@Injectable()
export default class LeaderboardPersistenceMapper {
  public mapToDataModel(leaderboard: Leaderboard): LeaderboardModel {
    return {
      id: leaderboard.id.value,
      titleId: leaderboard.titleId.toString(),
      player: leaderboard.player.value,
      stats: leaderboard.stats,
    };
  }
}
