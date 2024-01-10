import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { SessionDocument } from '../models/SessionSchema';
import ILogger, { ILoggerSymbol } from '../../../ILogger';
import ISessionRepository from 'src/domain/repositories/ISessionRepository';
import Session from 'src/domain/aggregates/Session';
import SessionDomainMapper from '../mappers/SessionDomainMapper';
import SessionPersistanceMapper from '../mappers/SessionPersistanceMapper';
import TitleId from 'src/domain/value-objects/TitleId';
import SessionId from 'src/domain/value-objects/SessionId';
import Xuid from 'src/domain/value-objects/Xuid';
import IpAddress from 'src/domain/value-objects/IpAddress';
import MacAddress from 'src/domain/value-objects/MacAddress';

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

  public async findSessionsByIPAndMac(ip: IpAddress, mac: MacAddress) {
    const query: Record<string, string> = { hostAddress: ip.value.toString() };

    if (mac) {
      query.macAddress = mac.value.toString();
    }

    const sessions = await this.SessionModel.find(query);
    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async deleteSessions(sessions: Session[]) {
    if (sessions.length <= 0) {
      console.log('Sessions already deleted.');
      return;
    }

    sessions.forEach(async (session) => {
      await this.SessionModel.findOneAndDelete({
        id: session.id.value,
        titleId: session.titleId.toString(),
      });

      const qosPath = join(
        process.cwd(),
        'qos',
        session.titleId.toString(),
        session.id.value,
      );

      // Delete QoS data for the session.
      if (existsSync(qosPath)) {
        await unlink(qosPath);
      }

      console.log(
        `Deleted Session: ${session.id.value} from ${session.hostAddress.value}`,
      );
    });
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
