import { TinyTypeOf } from 'tiny-types';

export default class ServiceId extends TinyTypeOf<number>() {
  public constructor(value: string) {
    super(Number(`0x${value}`));
  }

  public toString(): string {
    return this.value.toString(16).toUpperCase();
  }
}
