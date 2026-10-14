import { TinyTypeOf } from 'tiny-types';

export const kPropertyScopeMask = 0x00008000;

export enum AggregationType {
  Last = 0x8001, // Write the new value.
  Max = 0x800b, // Write the new value if it is greater than the existing value.
  Sum = 0x8003, // Add the new value to the existing value and write the result.
  Min = 0x8009, // Write the new value if it is less than the existing value.
}

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

export enum XProperty {
  PLAYER_PARTIAL_PLAY_PERCENTAGE = 0x1000800c,
  PLAYER_SKILL_UPDATE_WEIGHTING_FACTOR = 0x1000800d,
  SESSION_SKILL_BETA = 0x3000800e,
  SESSION_SKILL_TAU = 0x3000800f,
  SESSION_SKILL_DRAW_PROBABILITY = 0x10008010,
  RELATIVE_SCORE = 0x1000800a,
  SESSION_TEAM = 0x1000800b,
  RANK = 0x10008001,
  GAMERNAME = 0x40008002,
  SESSION_ID = 0x20008003,
  GAMER_ZONE = 0x10008101,
  GAMER_COUNTRY = 0x10008102,
  GAMER_LANGUAGE = 0x10008103,
  GAMER_RATING = 0x50008104,
  GAMER_MU = 0x30008105,
  GAMER_SIGMA = 0x30008106,
  GAMER_PUID = 0x20008107,
  AFFILIATE_VALUE = 0x20008108,
  GAMER_HOSTNAME = 0x40008109,
  PLATFORM_TYPE = 0x10008201,
  PLATFORM_LOCK = 0x10008202,
}

export enum XContext {
  PRESENCE = 0x00008001,
  GAME_TYPE = 0x0000800a,
  GAME_MODE = 0x0000800b,
  SESSION_JOINABLE = 0x0000800c,
}

export const friendlyAggregationType: Record<number, string> = {
  [AggregationType.Last]: 'Last',
  [AggregationType.Max]: 'Max',
  [AggregationType.Sum]: 'Sum',
  [AggregationType.Min]: 'Min',
};

const friendlyNameMap: Record<number, string> = {
  [XProperty.PLAYER_PARTIAL_PLAY_PERCENTAGE]: 'Player Partial Play Percentage',
  [XProperty.PLAYER_SKILL_UPDATE_WEIGHTING_FACTOR]:
    'Player Skill Update Weighting Factor',
  [XProperty.SESSION_SKILL_BETA]: 'Session Skill Beta',
  [XProperty.SESSION_SKILL_TAU]: 'Session Skill Tau',
  [XProperty.SESSION_SKILL_DRAW_PROBABILITY]: 'Session Skill Draw Probability',
  [XProperty.RELATIVE_SCORE]: 'Relative Score',
  [XProperty.SESSION_TEAM]: 'Session Team',
  [XProperty.RANK]: 'Rank',
  [XProperty.GAMERNAME]: 'Gamer Name',
  [XProperty.SESSION_ID]: 'Session ID',
  [XProperty.GAMER_ZONE]: 'Gamer Zone',
  [XProperty.GAMER_COUNTRY]: 'Gamer Country',
  [XProperty.GAMER_LANGUAGE]: 'Gamer Language',
  [XProperty.GAMER_RATING]: 'Gamer Rating',
  [XProperty.GAMER_MU]: 'Gamer Mu',
  [XProperty.GAMER_SIGMA]: 'Gamer Sigma',
  [XProperty.GAMER_PUID]: 'Gamer PUID',
  [XProperty.AFFILIATE_VALUE]: 'Affiliate Value',
  [XProperty.GAMER_HOSTNAME]: 'Gamer Hostname',
  [XProperty.PLATFORM_TYPE]: 'Platform Type',
  [XProperty.PLATFORM_LOCK]: 'Platform Lock',

  [XContext.PRESENCE]: 'Presence',
  [XContext.GAME_TYPE]: 'Game Type',
  [XContext.GAME_MODE]: 'Game Mode',
  [XContext.SESSION_JOINABLE]: 'Session Joinable',
};

/*
  XUSER_PROPERTY - 24 Bytes
    - AttributeKey - 4 Bytes
    - Padding - 4 Bytes (not included in serialization)

    - X_USER_DATA - 16 Bytes
      - X_USER_DATA_TYPE - 8 Bytes
      - X_USER_DATA_UNION - 8 Bytes
*/

const XPropertySize: number = 20;

export default class Property extends TinyTypeOf<string>() {
  buffer: Buffer<ArrayBuffer>;
  data: Buffer<ArrayBuffer>;

  id_hex: string = '';
  id: XProperty;
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
    this.type = this.buffer.readUint8(4);

    if (
      this.type == X_USER_DATA_TYPE.WSTRING ||
      this.type == X_USER_DATA_TYPE.BINARY
    ) {
      const offset: number = 20;
      this.size = this.buffer.length - offset;

      this.data = this.buffer.subarray(offset, offset + this.size);
    } else {
      const offset: number = 12;
      this.size = this.buffer.length - offset;

      this.data = this.buffer.subarray(offset, offset + this.size);
    }

    this.id_hex = this.id.toString(16).toUpperCase().padStart(8, '0');
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

  static getType(id: number): X_USER_DATA_TYPE {
    return (id >>> 28) & 0xf;
  }

  getTypeString() {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
      case X_USER_DATA_TYPE.INT32: {
        return 'Int32';
      }
      case X_USER_DATA_TYPE.INT64: {
        return 'Int64';
      }
      case X_USER_DATA_TYPE.DOUBLE: {
        return 'Double';
      }
      case X_USER_DATA_TYPE.WSTRING: {
        return 'u16String';
      }
      case X_USER_DATA_TYPE.FLOAT: {
        return 'Float';
      }
      case X_USER_DATA_TYPE.BINARY: {
        return 'Binary';
      }
      case X_USER_DATA_TYPE.DATETIME: {
        return 'Datetime';
      }
      case X_USER_DATA_TYPE.UNSET: {
        return 'Unset';
      }
    }
  }

  getID() {
    return this.id;
  }

  getIDHexString() {
    return this.id_hex;
  }

  getSizeFromType() {
    return Property.getSizeFromType(this);
  }

  static getSizeFromType(property: Property) {
    switch (property.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
      case X_USER_DATA_TYPE.INT32:
      case X_USER_DATA_TYPE.FLOAT: {
        return 4;
      }
      case X_USER_DATA_TYPE.DATETIME:
      case X_USER_DATA_TYPE.DOUBLE:
      case X_USER_DATA_TYPE.INT64: {
        return 8;
      }
      case X_USER_DATA_TYPE.WSTRING:
      case X_USER_DATA_TYPE.BINARY:
      case X_USER_DATA_TYPE.UNSET: {
        return property.getBufferDataSize();
      }
    }
  }

  getBufferDataSize() {
    return this.size;
  }

  getParsedValue() {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
        return this.getData().readUInt32BE();
      case X_USER_DATA_TYPE.INT32:
        return this.getData().readInt32BE();
      case X_USER_DATA_TYPE.INT64:
        return this.getData().readBigInt64BE();
      case X_USER_DATA_TYPE.DOUBLE:
        return this.getData().readDoubleBE();
      case X_USER_DATA_TYPE.FLOAT:
        return this.getData().readFloatBE();
      case X_USER_DATA_TYPE.DATETIME:
        return this.getData().readBigUInt64BE();
    }
  }

  getParsedData() {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
      case X_USER_DATA_TYPE.INT32:
      case X_USER_DATA_TYPE.INT64:
      case X_USER_DATA_TYPE.DOUBLE:
      case X_USER_DATA_TYPE.FLOAT:
      case X_USER_DATA_TYPE.DATETIME:
        return this.getParsedValue();
      case X_USER_DATA_TYPE.WSTRING:
        return this.getUTF16();
      case X_USER_DATA_TYPE.BINARY:
        return this.getData();
    }
  }

  getParsedDataHex(): string {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT: {
        return this.getData()
          .readUInt32BE()
          .toString(16)
          .padStart(8, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.INT32: {
        return this.getData()
          .readInt32BE()
          .toString(16)
          .padStart(8, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.INT64: {
        return this.getData()
          .readBigInt64BE()
          .toString(16)
          .padStart(16, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.DOUBLE: {
        return this.getData()
          .readDoubleBE()
          .toString(16)
          .padStart(16, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.WSTRING: {
        return this.getUTF16();
      }
      case X_USER_DATA_TYPE.FLOAT: {
        return this.getData()
          .readFloatBE()
          .toString(16)
          .padStart(16, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.BINARY: {
        return this.getData().toString('hex').toUpperCase();
      }
      case X_USER_DATA_TYPE.DATETIME: {
        return this.getData()
          .readBigUInt64BE()
          .toString(16)
          .padStart(16, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.UNSET: {
        return 'Unset';
      }
    }
  }

  getFriendlyName(): string | undefined {
    return friendlyNameMap[this.getID()] ?? 'User-Defined';
  }

  toString(): string {
    return this.value;
  }

  isSystemProperty() {
    return (this.id & kPropertyScopeMask) === kPropertyScopeMask;
  }

  toStringPretty() {
    return `${this.getType() == X_USER_DATA_TYPE.CONTEXT ? 'Context' : 'Property'} ID:\t0x${this.getIDHexString()}  Data Type: ${this.getType()}  Size: ${this.getSizeFromType()}  Type: ${this.isSystemProperty() ? 'System' : 'Custom'}`;
  }

  isNumeric(): boolean {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
      case X_USER_DATA_TYPE.INT32:
      case X_USER_DATA_TYPE.INT64:
      case X_USER_DATA_TYPE.DOUBLE:
      case X_USER_DATA_TYPE.FLOAT:
      case X_USER_DATA_TYPE.DATETIME:
        return true;
      default:
        return false;
    }
  }

  // Value interpreted as a signed 64-bit integer, used for leaderboard ratings.
  getInt64Value(): bigint {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT:
        return BigInt(this.getData().readUInt32BE());
      case X_USER_DATA_TYPE.INT32:
        return BigInt(this.getData().readInt32BE());
      case X_USER_DATA_TYPE.INT64:
      case X_USER_DATA_TYPE.DATETIME:
        return this.getData().readBigInt64BE();
      case X_USER_DATA_TYPE.DOUBLE:
        return Property.clampInt64(this.getData().readDoubleBE());
      case X_USER_DATA_TYPE.FLOAT:
        return Property.clampInt64(this.getData().readFloatBE());
      default:
        return 0n;
    }
  }

  // Returns a negative value if this < other, positive if this > other.
  compare(other: Property): number {
    const a = this.getParsedValue();
    const b = other.getParsedValue();

    if (a === undefined || b === undefined || a === b) {
      return 0;
    }

    return a > b ? 1 : -1;
  }

  // Apply a leaderboard column aggregation to an existing stored value.
  static aggregate(
    existing: Property,
    incoming: Property,
    type: AggregationType,
  ): Property {
    if (
      existing.getType() !== incoming.getType() ||
      !existing.isNumeric() ||
      !incoming.isNumeric()
    ) {
      return incoming;
    }

    switch (type) {
      case AggregationType.Max:
        return incoming.compare(existing) > 0 ? incoming : existing;
      case AggregationType.Min:
        return incoming.compare(existing) < 0 ? incoming : existing;
      case AggregationType.Sum:
        return Property.sum(existing, incoming);
      case AggregationType.Last:
      default:
        return incoming;
    }
  }

  static sum(a: Property, b: Property): Property {
    const data = Buffer.alloc(Float64Array.BYTES_PER_ELEMENT);

    switch (a.getType()) {
      case X_USER_DATA_TYPE.CONTEXT: {
        const value = a.getData().readUInt32BE() + b.getData().readUInt32BE();
        data.writeUInt32BE(Math.min(value, 0xffffffff));
        break;
      }
      case X_USER_DATA_TYPE.INT32: {
        const value = a.getData().readInt32BE() + b.getData().readInt32BE();
        data.writeInt32BE(Math.max(-0x80000000, Math.min(value, 0x7fffffff)));
        break;
      }
      case X_USER_DATA_TYPE.INT64: {
        const value =
          a.getData().readBigInt64BE() + b.getData().readBigInt64BE();
        data.writeBigInt64BE(Property.clampInt64(value));
        break;
      }
      case X_USER_DATA_TYPE.DOUBLE: {
        data.writeDoubleBE(
          a.getData().readDoubleBE() + b.getData().readDoubleBE(),
        );
        break;
      }
      case X_USER_DATA_TYPE.FLOAT: {
        data.writeFloatBE(
          a.getData().readFloatBE() + b.getData().readFloatBE(),
        );
        break;
      }
      default:
        // Summing date times is meaningless, keep the latest value.
        return b;
    }

    return new Property(Property.SerializePropertyToBase64(a.getID(), data));
  }

  static clampInt64(value: number | bigint): bigint {
    const min = -(2n ** 63n);
    const max = 2n ** 63n - 1n;

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return value > 0 ? max : value < 0 ? min : 0n;
      }

      value = BigInt(Math.trunc(value));
    }

    return value < min ? min : value > max ? max : value;
  }

  static fromInt32(id: number, value: number): Property {
    const data = Buffer.alloc(Float64Array.BYTES_PER_ELEMENT);
    data.writeInt32BE(value);

    return new Property(Property.SerializePropertyToBase64(id, data));
  }

  static fromUTF16(id: number, value: string): Property {
    // Big endian null terminated UTF-16
    const data = Buffer.from(value + '\0', 'utf16le').swap16();

    return new Property(Property.SerializePropertyToBase64(id, data));
  }

  requiresAdditionalData(): boolean {
    return Property.requiresAdditionalData(this.getType());
  }

  static requiresAdditionalData(type: X_USER_DATA_TYPE): boolean {
    return type == X_USER_DATA_TYPE.BINARY || type == X_USER_DATA_TYPE.WSTRING;
  }

  toBase64(): string {
    return Property.SerializePropertyToBase64(this.getID(), this.data);
  }

  static SerializeContextToBase64(id: number, value: number): string {
    const buffer_size = 20;
    const buffer = Buffer.alloc(buffer_size);

    let offset: number = 0;

    buffer.writeInt32LE(id, offset);
    offset += 4;
    buffer.writeInt8(X_USER_DATA_TYPE.CONTEXT, offset);
    offset += 8;
    buffer.writeInt32BE(value, offset);

    return buffer.toString('base64');
  }

  static SerializePropertyToBase64(id: number, data: Uint8Array): string {
    const type: X_USER_DATA_TYPE = this.getType(id);

    const buffer_size = Property.requiresAdditionalData(type)
      ? XPropertySize + data.byteLength
      : XPropertySize;
    const buffer = Buffer.alloc(buffer_size);

    let offset: number = 0;

    buffer.writeInt32LE(id, offset);
    offset += Int32Array.BYTES_PER_ELEMENT;
    buffer.writeInt8(type, offset);
    offset += Float64Array.BYTES_PER_ELEMENT;

    if (Property.requiresAdditionalData(type)) {
      buffer.writeInt32BE(data.byteLength, offset);
      offset += Float64Array.BYTES_PER_ELEMENT;
      buffer.set(data, offset);
    } else {
      buffer.set(data, offset);
    }

    return buffer.toString('base64');
  }
}
