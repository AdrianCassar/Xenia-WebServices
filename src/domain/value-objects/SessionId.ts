import { TinyTypeOf } from 'tiny-types';

export default class SessionId extends TinyTypeOf<string>() {
  public constructor(value: string) {
    if (!/^[0-9A-Fa-f]+$/.test(value) || value.length != 16) {
      throw new Error('Invalid SessionId ' + value);
    }

    super(value.toLowerCase());
  }
}
