import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionFlags from '../value-objects/SessionFlags';
import SessionId from '../value-objects/SessionId';
import TitleId from '../value-objects/TitleId';
import Xuid from '../value-objects/Xuid';
import * as crypto from "crypto";

interface SessionProps {
  id: SessionId;
  titleId: TitleId;
  flags: SessionFlags;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  publicSlotsCount: number;
  privateSlotsCount: number;
  port: number;
  players: Xuid[];
  deleted: boolean;
  context: Map<string, number>;
  migration?: SessionId;
}

interface CreateProps {
  id: SessionId;
  titleId: TitleId;
  flags: SessionFlags;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  publicSlotsCount: number;
  privateSlotsCount: number;
  port: number;
}

interface ModifyProps {
  flags: SessionFlags;
  publicSlotsCount: number;
  privateSlotsCount: number;
}

interface CreateMigrationProps {
  session: Session;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  port: number;
}

interface ContextProps {
  context: Map<number, {contextId: number, value: number}>;
}

interface JoinProps {
  xuids: Xuid[];
}

interface LeaveProps {
  xuids: Xuid[];
}

export default class Session {
  private readonly props: SessionProps;

  public constructor(props: SessionProps) {
    this.props = props;
  }

  public static create(props: CreateProps) {
    return new Session({
      ...props,
      players: [],
      deleted: false,
      context: new Map<string, number>(),
    });
  }

  static randomSessionId() {
    const bytesHex = crypto
    .randomBytes(8)
    .reduce((o, v) => o + ('00' + v.toString(16)).slice(-2), '');

    return bytesHex;
  }

  public static createMigration(props: CreateMigrationProps) {
    const newSession = new Session({
      ...props.session.props,
      id: new SessionId(this.randomSessionId()),
      hostAddress: props.hostAddress,
      macAddress: props.macAddress,
      port: props.port,
      deleted: false,
    });

    props.session.props.migration = newSession.id;

    return newSession;
  }

  public addContext(props: ContextProps) {
    props.context.forEach((entry) => {
      this.props.context.set(entry.contextId.toString(16), entry.value);
    })
  }

  public modify(props: ModifyProps) {
    this.props.flags = this.flags.modify(props.flags);
    this.props.privateSlotsCount = props.privateSlotsCount;
    this.props.publicSlotsCount = props.publicSlotsCount;
  }

  public join(props: JoinProps) {
    this.props.players.push(...props.xuids);

    const xuidValues = this.props.players.map((xuid) => xuid.value);
    const distinctXuidValues = [...new Set(xuidValues)];
    this.props.players = distinctXuidValues.map((xuid) => new Xuid(xuid));
  }

  public leave(props: LeaveProps) {
    const xuidValues = props.xuids.map((xuid) => xuid.value);
    this.props.players = this.props.players.filter((player) => !xuidValues.includes(player.value));
  }

  public delete() {
    this.props.deleted = true;
  }

  get id() {
    return this.props.id;
  }

  get titleId() {
    return this.props.titleId;
  }

  get hostAddress() {
    return this.props.hostAddress;
  }

  get flags() {
    return this.props.flags;
  }

  get publicSlotsCount() {
    return this.props.publicSlotsCount;
  }

  get privateSlotsCount() {
    return this.props.privateSlotsCount;
  }

  get openPublicSlots() {
    return this.publicSlotsCount - this.players.length;
  }

  get openPrivateSlots() {
    // TODO: Implement
    return this.privateSlotsCount;
  }

  get filledPublicSlots() {
    return this.publicSlotsCount - this.openPublicSlots;
  }

  get filledPrivateSlots() {
    return this.privateSlotsCount - this.openPrivateSlots;
  }

  get macAddress() {
    return this.props.macAddress;
  }

  get port() {
    return this.props.port;
  }

  get players() {
    return this.props.players;
  }

  get deleted() {
    return this.props.deleted;
  }

  get migration() {
    return this.props.migration;
  }

  get context() {
    return this.props.context;
  }
}
