import { TinyTypeOf } from 'tiny-types';

const kPropertyScopeMask = 0x00008000;

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

  getTypeString() {
    switch (this.getType()) {
      case X_USER_DATA_TYPE.CONTEXT: {
        return 'Context';
      }
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

  getIDString() {
    return this.id_hex;
  }

  getSizeFromType() {
    switch (this.getType()) {
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
        return this.getBufferDataSize();
      }
    }
  }

  getBufferDataSize() {
    return this.size;
  }

  getParsedData() {
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
          .readUInt32BE()
          .toString(16)
          .padStart(8, '0')
          .toUpperCase();
      }
      case X_USER_DATA_TYPE.INT64: {
        return this.getData()
          .readBigUInt64BE()
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
    return `${this.getType() == X_USER_DATA_TYPE.CONTEXT ? 'Context' : 'Property'} ID:\t0x${this.getIDString()}  Data Type: ${this.getType()}  Size: ${this.getSizeFromType()}  Type: ${this.isSystemProperty() ? 'System' : 'Custom'}`;
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
}
