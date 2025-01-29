import { TinyTypeOf } from 'tiny-types';

export enum X_USER_DATA_TYPE {
  CONTEXT = 0,
  INT32 = 1,
  INT64 = 2,
  DOUBLE = 3,
  WSTRING = 4,
  FLOAT = 5,
  BINARY = 6,
  DATETIME = 7,
  UNSET = 0xff,
}

export default class Property extends TinyTypeOf<string>() {
  buffer: Buffer<ArrayBuffer>;
  data: Buffer<ArrayBuffer>;

  id_hex: string = '';
  id: number = 0;
  size: number = 0;
  type: X_USER_DATA_TYPE = 0;

  public constructor(base64: string) {
    super(base64);

    this.buffer = Buffer.from(base64, 'base64');

    // Check if base64 is valid
    if (this.buffer.toString('base64') !== base64) {
      throw new Error('Invalid base64');
    }

    this.id = this.buffer.readInt32LE(0);
    this.type = (this.buffer.readInt32BE(0) & 0xff) >> 4;
    this.size = this.buffer.readInt32LE(4);

    const offset: number = 8;
    this.data = this.buffer.subarray(offset, offset + this.size);
    this.id_hex = this.id.toString(16);
  }

  getUTF16() {
    if (this.type != X_USER_DATA_TYPE.WSTRING) {
      return '';
    }

    const decoder = new TextDecoder('utf-16be');
    const decoded_unicode: string = decoder.decode(this.data);

    return decoded_unicode;
  }

  getData() {
    return this.data;
  }

  getType() {
    return this.type;
  }

  getID() {
    return this.id;
  }

  getIDString() {
    return this.id_hex;
  }

  getSize() {
    return this.size;
  }

  toString(): string {
    return this.value;
  }

  toStringPretty() {
    return `${this.getType() == X_USER_DATA_TYPE.CONTEXT ? 'Context' : 'Property'} ID:\t0x${this.getIDString().toUpperCase().padStart(8, '0')}  Type: ${this.getType()}  Size: ${this.getSize()}`;
  }

  static SerializeContextToBase64(id: number, value: number): string {
    const buffer = Buffer.alloc(12);

    let offset: number = 0;

    buffer.writeInt32LE(id, offset);
    offset += 4;
    buffer.writeInt32LE(4, offset);
    offset += 4;
    buffer.writeInt32BE(value, offset);

    return buffer.toString('base64');
  }
}
