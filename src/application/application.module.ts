import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Session,
  SessionSchema,
} from 'src/infrastructure/persistance/models/SessionSchema';
import { PersistanceModule } from 'src/infrastructure/persistance/persistance.module';
import { CreatePlayerCommandHandler } from './commandHandlers/CreatePlayerCommandHandler';
import { CreateSessionCommandHandler } from './commandHandlers/CreateSessionCommandHandler';
import { AddSessionContextCommandHandler } from './commandHandlers/AddSessionContextCommandHandler';
import {
  DeleteSessionCommandHandler,
  DeleteSessionsCommandHandler,
} from './commandHandlers/DeleteSessionCommandHandler';
import { JoinSessionCommandHandler } from './commandHandlers/JoinSessionCommandHandler';
import { LeaveSessionCommandHandler } from './commandHandlers/LeaveSessionCommandHandler';
import { MigrateSessionCommandHandler } from './commandHandlers/MigrateSessionCommandHandler';
import { ModifySessionCommandHandler } from './commandHandlers/ModifySessionCommandHandler';
import { SetPlayerSessionIdCommandHandler } from './commandHandlers/SetPlayerSessionIdCommandHandler';
import { UpdateLeaderboardCommandHandler } from './commandHandlers/UpdateLeaderboardCommandHandler';
import { FindLeaderboardsQueryHandler } from './queryHandlers/FindLeaderboardsQueryHandler';
import { FindPlayerQueryHandler } from './queryHandlers/FindPlayerQueryHandler';
import { FindPlayerSessionQueryHandler } from './queryHandlers/FindPlayerSessionQueryHandler';
import { GetPlayerQueryHandler } from './queryHandlers/GetPlayerQueryHandler';
import { GetSessionsQueryHandler } from './queryHandlers/GetSessionQueryHandler';
import { SessionSearchQueryHandler } from './queryHandlers/SessionSearchQueryHandler';
import { AggregateSessionCommandHandler } from './commandHandlers/AggregateSessionCommandHandler';
import { ProcessClientAddressCommandHandler } from './commandHandlers/ProcessClientAddressCommandHandler';
import { GetPlayersQueryHandler } from './queryHandlers/GetPlayersQueryHandler';
import { UpdatePlayerCommandHandler } from './commandHandlers/UpdatePlayerCommandHandler';

export const queryHandlers = [
  GetSessionsQueryHandler,
  SessionSearchQueryHandler,
  FindPlayerQueryHandler,
  FindPlayerSessionQueryHandler,
  GetPlayerQueryHandler,
  GetPlayersQueryHandler,
  UpdatePlayerCommandHandler,
  FindLeaderboardsQueryHandler,
];

export const commandHandlers = [
  CreateSessionCommandHandler,
  ModifySessionCommandHandler,
  JoinSessionCommandHandler,
  LeaveSessionCommandHandler,
  CreatePlayerCommandHandler,
  DeleteSessionCommandHandler,
  DeleteSessionsCommandHandler,
  SetPlayerSessionIdCommandHandler,
  UpdateLeaderboardCommandHandler,
  MigrateSessionCommandHandler,
  AddSessionContextCommandHandler,
  AggregateSessionCommandHandler,
  ProcessClientAddressCommandHandler,
];

@Module({
  imports: [
    CqrsModule,
    PersistanceModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  providers: [...queryHandlers, ...commandHandlers],
})
export class ApplicationModule {}
