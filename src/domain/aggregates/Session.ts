import { ConsoleLogger } from '@nestjs/common';
import IpAddress from '../value-objects/IpAddress';
import MacAddress from '../value-objects/MacAddress';
import SessionFlags from '../value-objects/SessionFlags';
import SessionId from '../value-objects/SessionId';
import TitleId from '../value-objects/TitleId';
import Xuid from '../value-objects/Xuid';

interface SessionProps {
  id: SessionId;
  titleId: TitleId;
  title: string;
  mediaId: string;
  version: string;
  flags: SessionFlags;
  hostAddress: IpAddress;
  macAddress: MacAddress;
  publicSlotsCount: number;
  privateSlotsCount: number;
  port: number;
  players: Map<string, boolean>;
  deleted: boolean;
  context: Map<string, number>;
  migration?: SessionId;
}

interface CreateProps {
  id: SessionId;
  titleId: TitleId;
  title: string;
  mediaId: string;
  version: string;
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
  context: Map<number, { contextId: number; value: number }>;
}

interface JoinProps {
  members: Map<Xuid, boolean>;
}

interface LeaveProps {
  xuids: Xuid[];
}

export default class Session {
  private readonly props: SessionProps;

  private _availablePublicSlots: number = 0;
  private _availablePrivateSlots: number = 0;
  private _logger: ConsoleLogger = new ConsoleLogger('Session');

  public constructor(props: SessionProps) {
    this.props = props;

    // Set available slots
    const players = Array.from(this.players.values());

    const num_private_slots = players.filter((value) => value === true).length;
    const num_public_slots = players.filter((value) => value === false).length;

    this._availablePrivateSlots = Math.max(
      0,
      this.privateSlotsCount - num_private_slots,
    );

    this._availablePublicSlots = Math.max(
      0,
      this.publicSlotsCount - num_public_slots,
    );

    this._logger.setContext(`Session - ${props.id.value.toUpperCase()}`);
  }

  public static create(props: CreateProps) {
    return new Session({
      ...props,
      players: new Map<string, boolean>(),
      deleted: false,
      context: new Map<string, number>(),
    });
  }

  public static GenerateSessionId() {
    const rnd_value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    const session_id_value =
      (BigInt(0xae) << BigInt(56)) |
      (BigInt(rnd_value) & BigInt(0x0000ffffffffffff));

    const id_hex_string = session_id_value.toString(16);
    const session_id = id_hex_string.padEnd(16, '0');

    return session_id;
  }

  public static createMigration(props: CreateMigrationProps) {
    const newSession = new Session({
      ...props.session.props,
      id: new SessionId(this.GenerateSessionId()),
      hostAddress: props.hostAddress,
      macAddress: props.macAddress,
      port: props.port,
      deleted: false,
    });

    props.session.props.migration = newSession.id;

    newSession.availablePrivateSlots = props.session.availablePrivateSlots;
    newSession.availablePublicSlots = props.session.availablePublicSlots;

    return newSession;
  }

  public addContext(props: ContextProps) {
    props.context.forEach((entry) => {
      this.props.context.set(entry.contextId.toString(16), entry.value);
    });
  }

  public modify(props: ModifyProps) {
    this.props.flags = props.flags;

    const num_private_slots: number = Math.max(
      0,
      this.props.privateSlotsCount - this._availablePrivateSlots,
    );

    const num_public_slots: number = Math.max(
      0,
      this.props.publicSlotsCount - this._availablePublicSlots,
    );

    this.props.privateSlotsCount = props.privateSlotsCount;
    this.props.publicSlotsCount = props.publicSlotsCount;

    // Update available slots
    this._availablePrivateSlots = Math.max(
      0,
      this.props.privateSlotsCount - num_private_slots,
    );

    this._availablePublicSlots = Math.max(
      0,
      this.props.publicSlotsCount - num_public_slots,
    );
  }

  public join(props: JoinProps) {
    props.members.forEach((IsPrivate: boolean, xuid: Xuid) => {
      this.players.set(xuid.value, IsPrivate);

      if (IsPrivate) {
        this._availablePrivateSlots = Math.max(
          0,
          this._availablePrivateSlots - 1,
        );
      } else {
        this._availablePublicSlots = Math.max(
          0,
          this._availablePublicSlots - 1,
        );
      }

      this._logger.verbose(
        `Player Joining:: XUID: ${xuid.value} IsPrivate: ${IsPrivate ? 'true' : 'false'}`,
      );

      this._logger.verbose(
        `AvailablePrivateSlots: ${this.availablePrivateSlots}`,
      );

      this._logger.verbose(
        `AvailablePublicSlots: ${this.availablePublicSlots}`,
      );
    });
  }

  public leave(props: LeaveProps) {
    for (const xuid of Array.from(props.xuids)) {
      const IsPrivate: boolean = this.players[xuid.value];

      this.players.delete(xuid.value);

      if (IsPrivate) {
        this._availablePrivateSlots = Math.min(
          this.privateSlotsCount,
          this._availablePrivateSlots + 1,
        );
      } else {
        this._availablePublicSlots = Math.min(
          this.publicSlotsCount,
          this._availablePublicSlots + 1,
        );
      }

      this._logger.verbose(
        `Player Leaving:: XUID: ${xuid.value} IsPrivate: ${IsPrivate ? 'true' : 'false'}`,
      );

      this._logger.verbose(
        `AvailablePrivateSlots: ${this.availablePrivateSlots}`,
      );

      this._logger.verbose(
        `AvailablePublicSlots: ${this.availablePublicSlots}`,
      );
    }
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

  get title() {
    return this.props.title;
  }

  get mediaId() {
    return this.props.mediaId;
  }

  get version() {
    return this.props.version;
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

  get availablePublicSlots() {
    return this._availablePublicSlots;
  }

  set availablePublicSlots(publicSlots: number) {
    this._availablePublicSlots = Math.max(0, publicSlots);
  }

  get availablePrivateSlots() {
    return this._availablePrivateSlots;
  }

  set availablePrivateSlots(privateSlots: number) {
    this._availablePrivateSlots = Math.max(0, privateSlots);
  }

  get filledPublicSlots() {
    return this.publicSlotsCount - this.availablePublicSlots;
  }

  get filledPrivateSlots() {
    return this.privateSlotsCount - this.availablePrivateSlots;
  }

  get totalSlots() {
    return this.publicSlotsCount + this.privateSlotsCount;
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
