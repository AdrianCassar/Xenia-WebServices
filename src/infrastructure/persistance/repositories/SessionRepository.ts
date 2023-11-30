import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import ISessionRepository from 'src/domain/repositories/ISessionRepository';
import Session from 'src/domain/aggregates/Session';
import SessionDomainMapper from '../mappers/SessionDomainMapper';
import SessionPersistanceMapper from '../mappers/SessionPersistanceMapper';
import { SessionDocument } from '../models/SessionSchema';
import TitleId from 'src/domain/value-objects/TitleId';
import SessionId from 'src/domain/value-objects/SessionId';
import Xuid from 'src/domain/value-objects/Xuid';
import IpAddress from 'src/domain/value-objects/IpAddress';

@Injectable()
export default class SessionRepository implements ISessionRepository {
  constructor(
    @Inject(ILoggerSymbol) private readonly logger: ILogger,
    @InjectModel(Session.name)
    private SessionModel: Model<SessionDocument>,
    private readonly sessionDomainMapper: SessionDomainMapper,
    private readonly sessionPersistanceMapper: SessionPersistanceMapper,
  ) {}

  public async save(session: Session) {
    await this.SessionModel.findOneAndUpdate(
      {
        id: session.id.value,
        titleId: session.titleId.toString(),
      },
      this.sessionPersistanceMapper.mapToDataModel(session, new Date()),
      {
        upsert: true,
        new: true,
      },
    );
  }

  public async findSessionsByIP(ip: IpAddress) {
    const sessions = await this.SessionModel.find(
      {
        hostAddress: ip.value.toString()
      }
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async deleteSessions(sessions: Session[]) {
    // Deletes all sessions based on IP this will cause two players on the same network to delete each others sessions.
    // This method does not delete QoS data for the sessions.
    // This needs fixing!
    if (sessions.length > 0) {
      const hostAddress = sessions[0].hostAddress.value;
      const deleteResult = await this.SessionModel.deleteMany( { "hostAddress" : hostAddress } );

      console.log("Deleted " + deleteResult.deletedCount + " sessions from " + hostAddress);
    } else {
      console.log("Sessions already deleted.");
    }
  }

  public async findSession(titleId: TitleId, id: SessionId) {
    const session = await this.SessionModel.findOne({
      id: id.value,
      titleId: titleId.toString(),
    });

    if (!session) return undefined;

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findByPlayer(xuid: Xuid) {
    const session = await this.SessionModel.findOne({
      players: xuid.value,
    });

    if (!session) return undefined;

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findAdvertisedSessions(titleId: TitleId, resultsCount: number) {
    const sessions = await this.SessionModel.find(
      {
        advertised: true,
        deleted: false,
        migration: undefined,
        titleId: titleId.toString(),
      },
      undefined,
      {
        limit: resultsCount,
      },
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }
}
