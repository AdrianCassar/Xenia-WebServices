import { TinyTypeOf } from 'tiny-types';

export enum Flags {
  HOST = 1 << 0,
  PRESENCE = 1 << 1,
  STATS = 1 << 2,
  MATCHMAKING = 1 << 3,
  ARBITRATION = 1 << 4,
  PEER_NETWORK = 1 << 5,
  SOCIAL_MATCHMAKING_ALLOWED = 1 << 7,
  INVITES_DISABLED = 1 << 8,
  JOIN_VIA_PRESENCE_DISABLED = 1 << 9,
  JOIN_IN_PROGRESS_DISABLED = 1 << 10,
  JOIN_VIA_PRESENCE_FRIENDS_ONLY = 1 << 11,
}

export enum FlagsEx {
  SINGLEPLAYER_WITH_STATS = Flags.PRESENCE |
    Flags.STATS |
    Flags.INVITES_DISABLED |
    Flags.JOIN_VIA_PRESENCE_DISABLED |
    Flags.JOIN_IN_PROGRESS_DISABLED,

  LIVE_MULTIPLAYER_STANDARD = Flags.PRESENCE |
    Flags.STATS |
    Flags.MATCHMAKING |
    Flags.PEER_NETWORK,

  LIVE_MULTIPLAYER_RANKED = LIVE_MULTIPLAYER_STANDARD | Flags.ARBITRATION,
  SYSTEMLINK = Flags.PEER_NETWORK,
  GROUP_LOBBY = Flags.PRESENCE | Flags.PEER_NETWORK,
  GROUP_GAME = Flags.STATS | Flags.MATCHMAKING | Flags.PEER_NETWORK,
}

export default class SessionFlags extends TinyTypeOf<number>() {
  public constructor(value: number) {
    super(value);
  }

  private isFlagSet(flag: number) {
    return (this.value & flag) == flag;
  }

  public get isHost(): boolean {
    const host = this.isFlagSet(Flags.HOST);
    const stats_only = this.value == <number>Flags.STATS;
    const singleplayer = this.value == <number>FlagsEx.SINGLEPLAYER_WITH_STATS;

    return host || stats_only || singleplayer;
  }

  public get isAdvertised(): boolean {
    return this.isFlagSet(Flags.PRESENCE) || this.isFlagSet(Flags.MATCHMAKING);
  }

  public get isStats(): boolean {
    return this.isFlagSet(Flags.STATS);
  }

  public get isStatsSession(): boolean {
    const stats_only = this.value == <number>Flags.STATS;
    const stats_host_only =
      this.value == <number>Flags.STATS + <number>Flags.HOST;

    return stats_only || stats_host_only;
  }

  public get isFriendsOnly(): boolean {
    return this.isFlagSet(Flags.JOIN_VIA_PRESENCE_FRIENDS_ONLY);
  }
}
