import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionId from '../value-objects/SessionId';
import Xuid from '../value-objects/Xuid';
import Gamertag from '../value-objects/Gamertag';

interface PlayerProps {
  xuid: Xuid;
  gamertag: Gamertag;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  machineId: Xuid;
  port: number;
  sessionId?: SessionId;
}

interface CreateProps {
  xuid: Xuid;
  gamertag: Gamertag;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  machineId: Xuid;
}

export default class Player {
  private readonly props: PlayerProps;

  public constructor(props: PlayerProps) {
    this.props = props;
  }

  public static create(props: CreateProps) {
    return new Player({
      ...props,
      port: 36000, // Port hard-coded?
    });
  }

  public setSession(sessionId: SessionId) {
    this.props.sessionId = sessionId;
  }

  get xuid() {
    return this.props.xuid;
  }

  get hostAddress() {
    return this.props.hostAddress;
  }

  get gamertag() {
    return this.props.gamertag;
  }

  get machineId() {
    return this.props.machineId;
  }

  get macAddress() {
    return this.props.macAddress;
  }

  get port() {
    return this.props.port;
  }

  get sessionId() {
    return this.props.sessionId;
  }
}
