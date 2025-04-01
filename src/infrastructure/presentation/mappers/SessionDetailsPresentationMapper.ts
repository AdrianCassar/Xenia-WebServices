import Session from '../../../domain/aggregates/Session';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { SessionDetailsDto } from 'src/infrastructure/persistance/dtos/SessionDetailsDto';

@Injectable()
export default class SessionDetailsPresentationMapper {
  constructor(private readonly logger: ConsoleLogger) {}
  public CreateSessionDetails(session: Session): SessionDetailsDto {
    return {
      title: session.title,
      version: session.version,
      mediaId: session.mediaId,
      xuid: session.xuid.value,
      id: session.id.value,
      flags: session.flags.value,
      hostAddress: session.hostAddress.value,
      macAddress: session.macAddress.value,
      publicSlotsCount: session.publicSlotsCount,
      privateSlotsCount: session.privateSlotsCount,
      openPublicSlotsCount: session.availablePublicSlots,
      openPrivateSlotsCount: session.availablePrivateSlots,
      filledPublicSlotsCount: session.filledPublicSlots,
      filledPrivateSlotsCount: session.filledPrivateSlots,
      port: session.port,
    };
  }
}
