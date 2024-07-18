import { Session as SessionModel } from '../models/SessionSchema';
import Session from '../../../domain/aggregates/Session';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import TitleId from 'src/domain/value-objects/TitleId';
import IpAddress from 'src/domain/value-objects/IpAddress';
import SessionFlags from 'src/domain/value-objects/SessionFlags';
import MacAddress from 'src/domain/value-objects/MacAddress';
import SessionId from 'src/domain/value-objects/SessionId';
import Xuid from 'src/domain/value-objects/Xuid';

@Injectable()
export default class SessionDomainMapper {
  constructor(private readonly logger: ConsoleLogger) {}

  public mapToDomainModel(session: SessionModel): Session {
    return new Session({
      id: new SessionId(session.id),
      titleId: new TitleId(session.titleId),
      xuid: session.xuid ? new Xuid(session.xuid) : undefined,
      title: session.title,
      mediaId: session.mediaId,
      version: session.version,
      flags: new SessionFlags(session.flags),
      hostAddress: new IpAddress(session.hostAddress),
      macAddress: new MacAddress(session.macAddress),
      publicSlotsCount: session.publicSlotsCount,
      privateSlotsCount: session.privateSlotsCount,
      port: session.port,
      players: session.players,
      deleted: session.deleted,
      context: session.context,
      migration: session.migration
        ? new SessionId(session.migration)
        : undefined,
    });
  }
}
