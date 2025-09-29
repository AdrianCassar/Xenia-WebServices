import { TinyTypeOf } from 'tiny-types';

export enum StateFlags {
  NONE = 0x0,
  ONLINE = 0x1,
  PLAYING = 0x2,
  VOICE = 0x8,
  JOINABLE = 1 << 4,
  FRIENDS_ONLY = 1 << 8,
}

export default class StateFlag extends TinyTypeOf<number>() {
  public constructor(value: number) {
    super(Number(value));
  }

  private isFlagSet(flag: number) {
    return (this.value & flag) == flag;
  }

  public isOnline(): boolean {
    return this.isFlagSet(StateFlags.ONLINE);
  }

  public isJoinable(): boolean {
    return this.isFlagSet(StateFlags.JOINABLE);
  }

  public isPlaying(): boolean {
    return this.isFlagSet(StateFlags.PLAYING);
  }

  public isFriendsOnly(): boolean {
    return this.isFlagSet(StateFlags.FRIENDS_ONLY);
  }

  public setOnline() {
    this.value = this.value | StateFlags.ONLINE;
  }

  public setJoinable() {
    this.value = this.value | StateFlags.JOINABLE;
  }

  public setPlaying() {
    this.value = this.value | StateFlags.PLAYING;
  }

  public setFriendsOnly() {
    this.value = this.value | StateFlags.FRIENDS_ONLY;
  }

  public removeFlag(flag: number): void {
    this.value &= ~flag;
  }

  public toString(): string {
    return this.value.toString(16).toUpperCase();
  }
}
