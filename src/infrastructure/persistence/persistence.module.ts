import { Module } from '@nestjs/common';
import PersistenceSettings from './settings/PersistenceSettings';
import { MongooseModule } from '@nestjs/mongoose';
import { ILeaderboardRepositorySymbol } from 'src/domain/repositories/ILeaderboardRepository';
import LeaderboardRepository from './repositories/LeaderboardRepository';
import LeaderboardPersistenceMapper from './mappers/LeaderboardPersistenceMapper';
import LeaderboardDomainMapper from './mappers/LeaderboardDomainMapper';
import { Leaderboard, LeaderboardSchema } from './models/LeaderboardSchema';
import { IPlayerRepositorySymbol } from 'src/domain/repositories/IPlayerRepository';
import PlayerRepository from './repositories/PlayerRepository';
import PlayerPersistenceMapper from './mappers/PlayerPersistenceMapper';
import PlayerDomainMapper from './mappers/PlayerDomainMapper';
import { Player, PlayerSchema } from './models/PlayerSchema';
import { ISessionRepositorySymbol } from 'src/domain/repositories/ISessionRepository';
import SessionRepository from './repositories/SessionRepository';
import SessionPersistenceMapper from './mappers/SessionPersistenceMapper';
import SessionDomainMapper from './mappers/SessionDomainMapper';
import { Session, SessionSchema } from './models/SessionSchema';
import { PlayerStats, PlayerStatsSchema } from './models/PlayerStatsSchema';
import { IPlayersStatsSymbol } from 'src/domain/repositories/IPlayersStatsRepository';
import { PlayersStatsRepository } from './repositories/PlayersStatsRepository';

const persistenceSettings = new PersistenceSettings().get();

@Module({
  imports: [
    MongooseModule.forRoot(persistenceSettings.mongoURI),
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Leaderboard.name, schema: LeaderboardSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: PlayerStats.name, schema: PlayerStatsSchema },
    ]),
  ],
  providers: [
    {
      provide: ISessionRepositorySymbol,
      useClass: SessionRepository,
    },
    SessionPersistenceMapper,
    SessionDomainMapper,

    {
      provide: ILeaderboardRepositorySymbol,
      useClass: LeaderboardRepository,
    },
    LeaderboardPersistenceMapper,
    LeaderboardDomainMapper,

    {
      provide: IPlayerRepositorySymbol,
      useClass: PlayerRepository,
    },
    {
      provide: IPlayersStatsSymbol,
      useClass: PlayersStatsRepository,
    },
    PlayerPersistenceMapper,
    PlayerDomainMapper,
  ],
  exports: [
    ISessionRepositorySymbol,
    ILeaderboardRepositorySymbol,
    IPlayerRepositorySymbol,
    IPlayersStatsSymbol,
  ],
})
export class PersistenceModule {}
