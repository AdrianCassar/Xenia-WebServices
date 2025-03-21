import { Model } from 'mongoose';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { SessionDocument } from '../models/SessionSchema';
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
    private readonly logger: ConsoleLogger,
    @InjectModel(Session.name)
    private SessionModel: Model<SessionDocument>,
    private readonly sessionDomainMapper: SessionDomainMapper,
    private readonly sessionPersistanceMapper: SessionPersistanceMapper,
  ) {
    this.logger.setContext(SessionRepository.name);
  }

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

    if (!sessions) {
      return undefined;
    }

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async deleteSessions(sessions: Session[]) {
    if (sessions.length == 0) {
      this.logger.debug('Sessions already deleted.');
    }

    for (const session of sessions) {
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

      this.logger.debug(
        `Deleted Session: ${session.id.value} from ${session.hostAddress.value}`,
      );
    }
  }

  public async findSession(titleId: TitleId, id: SessionId) {
    const session = await this.SessionModel.findOne({
      id: id.value,
      titleId: titleId.toString(),
    });

    if (!session) {
      return undefined;
    }

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findByPlayer(xuid: Xuid) {
    const session = await this.SessionModel.findOne({
      players: xuid.value,
    });

    if (!session) {
      return undefined;
    }

    return this.sessionDomainMapper.mapToDomainModel(session);
  }

  public async findAdvertisedSessions(
    titleId: TitleId,
    resultsCount: number,
    numUsers: number,
  ) {
    const sessionsDocs = await this.SessionModel.find(
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

    let sessions: Session[] = sessionsDocs.map(
      this.sessionDomainMapper.mapToDomainModel,
    );

    // Remove private sessions
    sessions = sessions.filter((session) => {
      return session.publicSlotsCount != 0;
    });

    // Remove sessions that are full
    sessions = sessions.filter((session) => {
      return !session.isfull;
    });

    // Remove sessions with not enough slots
    if (numUsers) {
      sessions = sessions.filter((session) => {
        if (
          session.availablePublicSlots >= numUsers ||
          session.availablePrivateSlots >= numUsers
        ) {
          return true;
        }
      });
    }

    return sessions;
  }

  public async findAllAdvertisedSessions() {
    const sessions = await this.SessionModel.find(
      {
        advertised: true,
        deleted: false,
        migration: undefined,
      },
      undefined,
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }

  public async findTitleSessions(titleId: TitleId): Promise<Session[]> {
    const sessions = await this.SessionModel.find(
      {
        advertised: true,
        deleted: false,
        migration: undefined,
        titleId: titleId.toString(),
      },
      undefined,
    );

    return sessions.map(this.sessionDomainMapper.mapToDomainModel);
  }
}
