import IpAddress from 'src/domain/value-objects/IpAddress';

export class DeleteMyProfilesQuery {
  constructor(public readonly hostAddress: IpAddress) {}
}
