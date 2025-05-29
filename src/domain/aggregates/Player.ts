import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionId from '../value-objects/SessionId';
import Xuid from '../value-objects/Xuid';
import Gamertag from '../value-objects/Gamertag';
import TitleId from '../value-objects/TitleId';
import StateFlag, { StateFlags } from '../value-objects/StateFlag';

interface PlayerProps {
  xuid: Xuid;
  gamertag?: Gamertag;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  machineId: Xuid;
  port: number;
  sessionId?: SessionId;
  titleId?: TitleId;
  state?: StateFlag;
  richPresence?: string;
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

    if (!props?.gamertag) {
      props.gamertag = new Gamertag('Xenia User');
    }
  }

  public static create(props: CreateProps) {
    return new Player({
      ...props,
      port: 36000, // Port hard-coded?
      state: new StateFlag(
        StateFlags.ONLINE | StateFlags.JOINABLE | StateFlags.PLAYING,
      ),
      sessionId: new SessionId('0'.repeat(16)),
      titleId: new TitleId('0'),
      richPresence: '',
    });
  }

  public updatePlayer(player: Player) {
    this.props.xuid = player.xuid;
    this.props.gamertag = player.gamertag;
    this.props.hostAddress = player.hostAddress;
    this.props.macAddress = player.macAddress;
    this.props.machineId = player.machineId;
    this.props.port = player.port;
    this.props.sessionId = player.sessionId;
    this.props.titleId = player.titleId;
    this.props.state = player.state;
    this.props.richPresence = player.richPresence;
  }

  public setSession(sessionId: SessionId) {
    this.props.sessionId = sessionId;
  }

  public setTitleId(titleId: TitleId) {
    this.props.titleId = titleId;
  }

  public setGamertag(gamertag: Gamertag) {
    this.props.gamertag = gamertag;
  }

  public setRichPresence(richPresence: string) {
    this.props.richPresence = richPresence;
  }

  public setState(state: StateFlag) {
    this.props.state = state;
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

  get titleId() {
    return this.props.titleId;
  }

  get state() {
    return this.props.state;
  }

  get richPresence() {
    return this.props.richPresence;
  }
}
