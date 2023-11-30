import ServiceId from 'src/domain/value-objects/ServiceId';
import TitleId from 'src/domain/value-objects/TitleId';


export class GetServiceInfoQuery {
  constructor(
    public readonly title: TitleId,
    public readonly service: ServiceId,
  ) {}
}
