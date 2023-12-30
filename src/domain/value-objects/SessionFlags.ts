import { TinyTypeOf } from 'tiny-types';

export const Flags = {
  HOST: 0x01,
  PRESENCE: 0x02,
  STATS: 0x04,
  MATCHMAKING: 0x08,
  ARBITRATION: 0x10,
  PEER_NETWORK: 0x20,
  SOCIAL_MATCHMAKING_ALLOWED: 0x80,
  INVITES_DISABLED: 0x0100,
  JOIN_VIA_PRESENCE_DISABLED: 0x0200,
  JOIN_IN_PROGRESS_DISABLED: 0x0400,
  JOIN_VIA_PRESENCE_FRIENDS_ONLY: 0x0800
};

export default class SessionFlags extends TinyTypeOf<number>() {
  public constructor(value: number) {
    super(value);
  }

  private isFlagSet(flag: number) {
    return (this.value & flag) == flag;
  }

  public modify(flags: SessionFlags): SessionFlags {
    // if (this.isFlagSet(this.Flags.ARBITRATION)) {
    //   this.value &= ~this.Flags.ARBITRATION;
    // } else {
    //   this.value |= this.Flags.ARBITRATION;
    // }

    // TODO: Implement
    // There should be some modification here, but I'm unsure which flags are modified.
    console.warn("Session flag modification is not implemented!");

    return new SessionFlags(this.value);
  }

  public get isHost(): boolean {
    return this.isFlagSet(Flags.HOST);
  }

  public get isAdvertised(): boolean {
    return this.isFlagSet(Flags.PRESENCE) || this.isFlagSet(Flags.MATCHMAKING);
  }

  public get isStats(): boolean {
    return this.isFlagSet(Flags.STATS);
  }
}
