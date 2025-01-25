import { Injectable } from '@nestjs/common';
import Session from '../../../domain/aggregates/Session';
import { Session as SessionModel } from '../models/SessionSchema';

@Injectable()
export default class SessionPersistanceMapper {
  public mapToDataModel(session: Session, updatedAt: Date): SessionModel {
    const properties: Array<string> = session.properties.map((prop) => {
      return prop.toString();
    });

    return {
      id: session.id.value,
      titleId: session.titleId.toString(),
      xuid: session.xuid ? session.xuid.value : undefined,
      title: session.title,
      mediaId: session.mediaId,
      version: session.version,
      hostAddress: session.hostAddress.value,
      flags: session.flags.value,
      publicSlotsCount: session.publicSlotsCount,
      privateSlotsCount: session.privateSlotsCount,
      advertised: session.flags.isAdvertised,
      macAddress: session.macAddress.value,
      port: session.port,
      players: session.players,
      deleted: session.deleted,
      context: session.context,
      properties: properties,
      migration: session.migration ? session.migration.value : undefined,
      updatedAt,
    };
  }
}
