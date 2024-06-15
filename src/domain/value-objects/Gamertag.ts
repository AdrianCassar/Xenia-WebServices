import { TinyTypeOf } from 'tiny-types';

export default class Gamertag extends TinyTypeOf<string>() {
  public constructor(value: string) {
    if (value == null || value.length > 15) {
      throw new Error(`Invalid Gamertag: ${value}`);
    }

    super(value);
  }
}
