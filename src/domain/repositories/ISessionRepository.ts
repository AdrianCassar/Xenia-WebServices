import Session from '../aggregates/Session';
import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionId from '../value-objects/SessionId';
import TitleId from '../value-objects/TitleId';
import Xuid from '../value-objects/Xuid';

export default interface ISessionRepository {
  findAdvertisedSessions: (
    titleId: TitleId,
    searcher_xuid: Xuid,
    resultsCount: number,
    numUsers: number,
    query_id: number,
    filters: Array<string>,
  ) => Promise<Session[]>;
  findAllAdvertisedSessions: () => Promise<Session[]>;
  findSession: (
    titleId: TitleId,
    id: SessionId,
  ) => Promise<Session | undefined>;
  findSessionsByIPAndMac: (
    hostAddress: IpAddress,
    macAddress: MacAddress,
  ) => Promise<Session[]>;
  findByPlayer: (xuid: Xuid) => Promise<Session>;
  findTitleSessions: (titleId: TitleId) => Promise<Session[]>;
  deleteSessions: (sessions: Session[]) => Promise<void>;
  save: (session: Session) => Promise<void>;
}

export const ISessionRepositorySymbol = Symbol('ISessionRepository');
