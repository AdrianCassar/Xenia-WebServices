import Session from '../../../domain/aggregates/Session';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { SessionDto } from '../../persistance/dtos/SessionDto';

@Injectable()
export default class SessionPresentationMapper {
  constructor(private readonly logger: ConsoleLogger) {}
  public mapToPresentationModel(session: Session): SessionDto {
    return {
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
