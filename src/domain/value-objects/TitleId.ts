import { TinyTypeOf } from 'tiny-types';

export default class TitleId extends TinyTypeOf<number>() {
  public static isValidValue(value: string): boolean {
    return /^[0-9A-F]{8}$/i.test(value);
  }

  public constructor(value: string) {
    super(Number(`0x${value}`));
  }

  public toString(): string {
    return this.value.toString(16).toUpperCase();
  }
}
