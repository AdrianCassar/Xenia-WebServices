import { TinyTypeOf } from 'tiny-types';
import { X_USER_DATA_TYPE, kPropertyScopeMask } from './Property';

export const kTitleSpecificMask = 0x3f00;

export enum XUserSetting {
  XPROFILE_PERMISSIONS = 0x10040000,
  XPROFILE_GAMER_TYPE = 0x10040001,
  XPROFILE_GAMER_YAXIS_INVERSION = 0x10040002,
  XPROFILE_OPTION_CONTROLLER_VIBRATION = 0x10040003,
  XPROFILE_GAMERCARD_ZONE = 0x10040004,
  XPROFILE_GAMERCARD_REGION = 0x10040005,
  XPROFILE_GAMERCARD_CRED = 0x10040006,
  XPROFILE_GAMER_PRESENCE_USER_STATE = 0x10040007,
  XPROFILE_GAMERCARD_HAS_VISION = 0x10040008,
  XPROFILE_OPTION_VOICE_MUTED = 0x1004000c,
  XPROFILE_OPTION_VOICE_THRU_SPEAKERS = 0x1004000d,
  XPROFILE_OPTION_VOICE_VOLUME = 0x1004000e,
  XPROFILE_GAMERCARD_TITLES_PLAYED = 0x10040012,
  XPROFILE_GAMERCARD_ACHIEVEMENTS_EARNED = 0x10040013,
  XPROFILE_GAMER_DIFFICULTY = 0x10040015,
  XPROFILE_GAMER_CONTROL_SENSITIVITY = 0x10040018,
  XPROFILE_GAMER_PREFERRED_COLOR_FIRST = 0x1004001d,
  XPROFILE_GAMER_PREFERRED_COLOR_SECOND = 0x1004001e,
  XPROFILE_GAMER_ACTION_AUTO_AIM = 0x10040022,
  XPROFILE_GAMER_ACTION_AUTO_CENTER = 0x10040023,
  XPROFILE_GAMER_ACTION_MOVEMENT_CONTROL = 0x10040024,
  XPROFILE_GAMER_RACE_TRANSMISSION = 0x10040026,
  XPROFILE_GAMER_RACE_CAMERA_LOCATION = 0x10040027,
  XPROFILE_GAMER_RACE_BRAKE_CONTROL = 0x10040028,
  XPROFILE_GAMER_RACE_ACCELERATOR_CONTROL = 0x10040029,
  XPROFILE_GAMERCARD_TITLE_CRED_EARNED = 0x10040038,
  XPROFILE_GAMERCARD_TITLE_ACHIEVEMENTS_EARNED = 0x10040039,
  XPROFILE_GAMER_TIER = 0x1004003a,
  XPROFILE_MESSENGER_SIGNUP_STATE = 0x1004003b,
  XPROFILE_MESSENGER_AUTO_SIGNIN = 0x1004003c,
  XPROFILE_SAVE_WINDOWS_LIVE_PASSWORD = 0x1004003d,
  XPROFILE_FRIENDSAPP_SHOW_BUDDIES = 0x1004003e,
  XPROFILE_GAMERCARD_SERVICE_TYPE_FLAGS = 0x1004003f,
  XPROFILE_TENURE_LEVEL = 0x10040047,
  XPROFILE_TENURE_MILESTONE = 0x10040048,
  XPROFILE_SUBSCRIPTION_TYPE_LENGTH_IN_MONTHS = 0x1004004b,
  XPROFILE_SUBSCRIPTION_PAYMENT_TYPE = 0x1004004c,
  XPROFILE_PEC_INFO = 0x1004004d,
  XPROFILE_NUI_BIOMETRIC_SIGNIN = 0x1004004e,
  XPROFILE_GFWL_VADNORMAL = 0x1004004f,
  XPROFILE_BEACONS_SOCIAL_NETWORK_SHARING = 0x10040052,
  XPROFILE_USER_PREFERENCES = 0x10040053,
  XPROFILE_XBOXONE_GAMERSCORE = 0x10040057,
  WEB_EMAIL_FORMAT = 0x10042000,
  WEB_FLAGS = 0x10042001,
  WEB_SPAM = 0x10042002,
  WEB_FAVORITE_GENRE = 0x10042003,
  WEB_FAVORITE_GAME = 0x10042004,
  WEB_FAVORITE_GAME1 = 0x10042005,
  WEB_FAVORITE_GAME2 = 0x10042006,
  WEB_FAVORITE_GAME3 = 0x10042007,
  WEB_FAVORITE_GAME4 = 0x10042008,
  WEB_FAVORITE_GAME5 = 0x10042009,
  WEB_PLATFORMS_OWNED = 0x1004200a,
  WEB_CONNECTION_SPEED = 0x1004200b,
  WEB_FLASH = 0x1004200c,
  WEB_VIDEO_PREFERENCE = 0x1004200d,
  XPROFILE_CRUX_MEDIA_STYLE1 = 0x100403ea,
  XPROFILE_CRUX_MEDIA_STYLE2 = 0x100403eb,
  XPROFILE_CRUX_MEDIA_STYLE3 = 0x100403ec,
  XPROFILE_CRUX_TOP_ALBUM1 = 0x100403ed,
  XPROFILE_CRUX_TOP_ALBUM2 = 0x100403ee,
  XPROFILE_CRUX_TOP_ALBUM3 = 0x100403ef,
  XPROFILE_CRUX_TOP_ALBUM4 = 0x100403f0,
  XPROFILE_CRUX_TOP_ALBUM5 = 0x100403f1,
  XPROFILE_CRUX_BKGD_IMAGE = 0x100403f3,
  XPROFILE_GAMERCARD_USER_LOCATION = 0x40520041,
  XPROFILE_GAMERCARD_USER_NAME = 0x41040040,
  XPROFILE_GAMERCARD_USER_URL = 0x41900042,
  XPROFILE_GAMERCARD_USER_BIO = 0x43e80043,
  XPROFILE_CRUX_BIO = 0x43e803fa,
  XPROFILE_CRUX_BG_SMALL_PRIVATE = 0x406403fb,
  XPROFILE_CRUX_BG_LARGE_PRIVATE = 0x406403fc,
  XPROFILE_CRUX_BG_SMALL_PUBLIC = 0x406403fd,
  XPROFILE_CRUX_BG_LARGE_PUBLIC = 0x406403fe,
  XPROFILE_GAMERCARD_PICTURE_KEY = 0x4064000f,
  XPROFILE_GAMERCARD_PERSONAL_PICTURE = 0x40640010,
  XPROFILE_GAMERCARD_MOTTO = 0x402c0011,
  XPROFILE_GFWL_RECDEVICEDESC = 0x40c80049,
  XPROFILE_GFWL_PLAYDEVICEDESC = 0x40c8004b,
  XPROFILE_CRUX_MEDIA_PICTURE = 0x406403e8,
  XPROFILE_CRUX_MEDIA_MOTTO = 0x410003f6,
  XPROFILE_GAMERCARD_REP = 0x5004000b,
  XPROFILE_GFWL_VOLUMELEVEL = 0x5004004c,
  XPROFILE_GFWL_RECLEVEL = 0x5004004d,
  XPROFILE_GFWL_PLAYDEVICE = 0x6010004a,
  XPROFILE_VIDEO_METADATA = 0x6020004a,
  XPROFILE_CRUX_OFFLINE_ID = 0x603403f2,
  XPROFILE_UNK_61180050 = 0x61180050,
  XPROFILE_JUMP_IN_LIST = 0x63e80051,
  XPROFILE_GAMERCARD_PARTY_ADDR = 0x60620054,
  XPROFILE_CRUX_TOP_MUSIC = 0x60a803f5,
  XPROFILE_CRUX_TOP_MEDIAID1 = 0x601003f7,
  XPROFILE_CRUX_TOP_MEDIAID2 = 0x601003f8,
  XPROFILE_CRUX_TOP_MEDIAID3 = 0x601003f9,
  XPROFILE_GAMERCARD_AVATAR_INFO_1 = 0x63e80044,
  XPROFILE_GAMERCARD_AVATAR_INFO_2 = 0x63e80045,
  XPROFILE_GAMERCARD_PARTY_INFO = 0x61000046,
  XPROFILE_TITLE_SPECIFIC1 = 0x63e83fff,
  XPROFILE_TITLE_SPECIFIC2 = 0x63e83ffe,
  XPROFILE_TITLE_SPECIFIC3 = 0x63e83ffd,
  XPROFILE_CRUX_LAST_CHANGE_TIME = 0x700803f4,
  XPROFILE_TENURE_NEXT_MILESTONE_DATE = 0x70080049,
  XPROFILE_LAST_LIVE_SIGNIN = 0x7008004f,
}

const friendlyNameMap: Record<number, string> = {
  [XUserSetting.XPROFILE_PERMISSIONS]: 'Permissions',
  [XUserSetting.XPROFILE_GAMER_TYPE]: 'Gamer Type',
  [XUserSetting.XPROFILE_GAMER_YAXIS_INVERSION]: 'Y-Axis Inversion',
  [XUserSetting.XPROFILE_OPTION_CONTROLLER_VIBRATION]: 'Controller Vibration',
  [XUserSetting.XPROFILE_GAMERCARD_ZONE]: 'Gamercard Zone',
  [XUserSetting.XPROFILE_GAMERCARD_REGION]: 'Gamercard Region',
  [XUserSetting.XPROFILE_GAMERCARD_CRED]: 'Gamercard Cred',
  [XUserSetting.XPROFILE_GAMER_PRESENCE_USER_STATE]: 'Presence User State',
  [XUserSetting.XPROFILE_GAMERCARD_HAS_VISION]: 'Vision Enabled',
  [XUserSetting.XPROFILE_OPTION_VOICE_MUTED]: 'Voice Muted',
  [XUserSetting.XPROFILE_OPTION_VOICE_THRU_SPEAKERS]: 'Voice Through Speakers',
  [XUserSetting.XPROFILE_OPTION_VOICE_VOLUME]: 'Voice Volume',
  [XUserSetting.XPROFILE_GAMERCARD_TITLES_PLAYED]: 'Titles Played',
  [XUserSetting.XPROFILE_GAMERCARD_ACHIEVEMENTS_EARNED]: 'Achievements Earned',
  [XUserSetting.XPROFILE_GAMER_DIFFICULTY]: 'Difficulty',
  [XUserSetting.XPROFILE_GAMER_CONTROL_SENSITIVITY]: 'Control Sensitivity',
  [XUserSetting.XPROFILE_GAMER_PREFERRED_COLOR_FIRST]:
    'Primary Preferred Color',
  [XUserSetting.XPROFILE_GAMER_PREFERRED_COLOR_SECOND]:
    'Secondary Preferred Color',
  [XUserSetting.XPROFILE_GAMER_ACTION_AUTO_AIM]: 'Auto Aim',
  [XUserSetting.XPROFILE_GAMER_ACTION_AUTO_CENTER]: 'Auto Center',
  [XUserSetting.XPROFILE_GAMER_ACTION_MOVEMENT_CONTROL]: 'Movement Control',
  [XUserSetting.XPROFILE_GAMER_RACE_TRANSMISSION]: 'Race Transmission',
  [XUserSetting.XPROFILE_GAMER_RACE_CAMERA_LOCATION]: 'Race Camera Location',
  [XUserSetting.XPROFILE_GAMER_RACE_BRAKE_CONTROL]: 'Brake Control',
  [XUserSetting.XPROFILE_GAMER_RACE_ACCELERATOR_CONTROL]: 'Accelerator Control',
  [XUserSetting.XPROFILE_GAMERCARD_TITLE_CRED_EARNED]: 'Title Cred Earned',
  [XUserSetting.XPROFILE_GAMERCARD_TITLE_ACHIEVEMENTS_EARNED]:
    'Title Achievements Earned',
  [XUserSetting.XPROFILE_GAMER_TIER]: 'Gamer Tier',
  [XUserSetting.XPROFILE_MESSENGER_SIGNUP_STATE]: 'Messenger Signup State',
  [XUserSetting.XPROFILE_MESSENGER_AUTO_SIGNIN]: 'Messenger Auto Sign-in',
  [XUserSetting.XPROFILE_SAVE_WINDOWS_LIVE_PASSWORD]:
    'Save Windows Live Password',
  [XUserSetting.XPROFILE_FRIENDSAPP_SHOW_BUDDIES]: 'Show Friends',
  [XUserSetting.XPROFILE_GAMERCARD_SERVICE_TYPE_FLAGS]: 'Service Type Flags',
  [XUserSetting.XPROFILE_TENURE_LEVEL]: 'Tenure Level',
  [XUserSetting.XPROFILE_TENURE_MILESTONE]: 'Tenure Milestone',
  [XUserSetting.XPROFILE_SUBSCRIPTION_TYPE_LENGTH_IN_MONTHS]:
    'Subscription Length (Months)',
  [XUserSetting.XPROFILE_SUBSCRIPTION_PAYMENT_TYPE]:
    'Subscription Payment Type',
  [XUserSetting.XPROFILE_PEC_INFO]: 'Parental Control Info',
  [XUserSetting.XPROFILE_NUI_BIOMETRIC_SIGNIN]: 'Biometric Sign-in',
  [XUserSetting.XPROFILE_GFWL_VADNORMAL]: 'GFWL Voice Activity Detection',
  [XUserSetting.XPROFILE_BEACONS_SOCIAL_NETWORK_SHARING]:
    'Social Network Sharing',
  [XUserSetting.XPROFILE_USER_PREFERENCES]: 'User Preferences',
  [XUserSetting.XPROFILE_XBOXONE_GAMERSCORE]: 'Xbox One Gamerscore',

  [XUserSetting.WEB_EMAIL_FORMAT]: 'Email Format',
  [XUserSetting.WEB_FLAGS]: 'Web Flags',
  [XUserSetting.WEB_SPAM]: 'Spam Preferences',
  [XUserSetting.WEB_FAVORITE_GENRE]: 'Favorite Genre',
  [XUserSetting.WEB_FAVORITE_GAME]: 'Favorite Game',
  [XUserSetting.WEB_FAVORITE_GAME1]: 'Favorite Game 1',
  [XUserSetting.WEB_FAVORITE_GAME2]: 'Favorite Game 2',
  [XUserSetting.WEB_FAVORITE_GAME3]: 'Favorite Game 3',
  [XUserSetting.WEB_FAVORITE_GAME4]: 'Favorite Game 4',
  [XUserSetting.WEB_FAVORITE_GAME5]: 'Favorite Game 5',
  [XUserSetting.WEB_PLATFORMS_OWNED]: 'Platforms Owned',
  [XUserSetting.WEB_CONNECTION_SPEED]: 'Connection Speed',
  [XUserSetting.WEB_FLASH]: 'Flash Enabled',
  [XUserSetting.WEB_VIDEO_PREFERENCE]: 'Video Preference',

  [XUserSetting.XPROFILE_CRUX_MEDIA_STYLE1]: 'Media Style 1',
  [XUserSetting.XPROFILE_CRUX_MEDIA_STYLE2]: 'Media Style 2',
  [XUserSetting.XPROFILE_CRUX_MEDIA_STYLE3]: 'Media Style 3',
  [XUserSetting.XPROFILE_CRUX_TOP_ALBUM1]: 'Top Album 1',
  [XUserSetting.XPROFILE_CRUX_TOP_ALBUM2]: 'Top Album 2',
  [XUserSetting.XPROFILE_CRUX_TOP_ALBUM3]: 'Top Album 3',
  [XUserSetting.XPROFILE_CRUX_TOP_ALBUM4]: 'Top Album 4',
  [XUserSetting.XPROFILE_CRUX_TOP_ALBUM5]: 'Top Album 5',
  [XUserSetting.XPROFILE_CRUX_BKGD_IMAGE]: 'Background Image',

  [XUserSetting.XPROFILE_GAMERCARD_USER_LOCATION]: 'User Location',
  [XUserSetting.XPROFILE_GAMERCARD_USER_NAME]: 'User Name',
  [XUserSetting.XPROFILE_GAMERCARD_USER_URL]: 'User URL',
  [XUserSetting.XPROFILE_GAMERCARD_USER_BIO]: 'User Bio',
  [XUserSetting.XPROFILE_CRUX_BIO]: 'Crux Bio',

  [XUserSetting.XPROFILE_CRUX_BG_SMALL_PRIVATE]: 'Private Small Background',
  [XUserSetting.XPROFILE_CRUX_BG_LARGE_PRIVATE]: 'Private Large Background',
  [XUserSetting.XPROFILE_CRUX_BG_SMALL_PUBLIC]: 'Public Small Background',
  [XUserSetting.XPROFILE_CRUX_BG_LARGE_PUBLIC]: 'Public Large Background',

  [XUserSetting.XPROFILE_GAMERCARD_PICTURE_KEY]: 'Gamercard Picture Key',
  [XUserSetting.XPROFILE_GAMERCARD_PERSONAL_PICTURE]: 'Personal Picture',
  [XUserSetting.XPROFILE_GAMERCARD_MOTTO]: 'Motto',

  [XUserSetting.XPROFILE_GFWL_RECDEVICEDESC]: 'Recording Device',
  [XUserSetting.XPROFILE_GFWL_PLAYDEVICEDESC]: 'Playback Device',
  [XUserSetting.XPROFILE_CRUX_MEDIA_PICTURE]: 'Media Picture',
  [XUserSetting.XPROFILE_CRUX_MEDIA_MOTTO]: 'Media Motto',

  [XUserSetting.XPROFILE_GAMERCARD_REP]: 'Reputation',
  [XUserSetting.XPROFILE_GFWL_VOLUMELEVEL]: 'GFWL Volume Level',
  [XUserSetting.XPROFILE_GFWL_RECLEVEL]: 'GFWL Recording Level',
  [XUserSetting.XPROFILE_GFWL_PLAYDEVICE]: 'GFWL Playback Device',
  [XUserSetting.XPROFILE_VIDEO_METADATA]: 'Video Metadata',
  [XUserSetting.XPROFILE_CRUX_OFFLINE_ID]: 'Offline ID',

  [XUserSetting.XPROFILE_UNK_61180050]: 'Unknown Setting (61180050)',
  [XUserSetting.XPROFILE_JUMP_IN_LIST]: 'Jump-In List',
  [XUserSetting.XPROFILE_GAMERCARD_PARTY_ADDR]: 'Party Address',
  [XUserSetting.XPROFILE_CRUX_TOP_MUSIC]: 'Top Music',

  [XUserSetting.XPROFILE_CRUX_TOP_MEDIAID1]: 'Top Media ID 1',
  [XUserSetting.XPROFILE_CRUX_TOP_MEDIAID2]: 'Top Media ID 2',
  [XUserSetting.XPROFILE_CRUX_TOP_MEDIAID3]: 'Top Media ID 3',

  [XUserSetting.XPROFILE_GAMERCARD_AVATAR_INFO_1]: 'Avatar Info 1',
  [XUserSetting.XPROFILE_GAMERCARD_AVATAR_INFO_2]: 'Avatar Info 2',
  [XUserSetting.XPROFILE_GAMERCARD_PARTY_INFO]: 'Party Info',

  [XUserSetting.XPROFILE_TITLE_SPECIFIC1]: 'Title-Specific Setting 1',
  [XUserSetting.XPROFILE_TITLE_SPECIFIC2]: 'Title-Specific Setting 2',
  [XUserSetting.XPROFILE_TITLE_SPECIFIC3]: 'Title-Specific Setting 3',

  [XUserSetting.XPROFILE_CRUX_LAST_CHANGE_TIME]: 'Last Profile Change Time',
  [XUserSetting.XPROFILE_TENURE_NEXT_MILESTONE_DATE]:
    'Next Tenure Milestone Date',
  [XUserSetting.XPROFILE_LAST_LIVE_SIGNIN]: 'Last Xbox Live Sign-in',
};

/*
  X_XDBF_GPD_SETTING_HEADER - 24 Bytes
    - AttributeKey - 4 Bytes
    - Padding - 4 Bytes (included in serialization)
    - X_USER_DATA_TYPE - 8 Bytes
    - Padding - 7 Bytes (included in serialization)
    - X_USER_DATA_UNION - 8 Bytes
*/
export default class UserSetting extends TinyTypeOf<string>() {
  buffer: Buffer<ArrayBuffer>;
  data: Buffer<ArrayBuffer>;

  id_hex: string = '';
  id: XUserSetting;
  size: number = 0;
  type: X_USER_DATA_TYPE = 0;

  public constructor(base64: string) {
    super(base64);

    this.buffer = Buffer.from(base64, 'base64');

    // Check if base64 is valid
    if (this.buffer.toString('base64') !== base64) {
      throw new Error('Invalid base64');
    }

    this.id = this.buffer.readInt32BE(0);
    this.type = this.buffer.readUint8(8);

    if (
      this.type == X_USER_DATA_TYPE.WSTRING ||
      this.type == X_USER_DATA_TYPE.BINARY
    ) {
      const offset: number = 24;
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
        let data = this.getData()
          .toString('hex')
          .toUpperCase()
          .substring(0, 50);

        if (data.length >= 50) {
          data += '...';
        }

        return data;
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
    return friendlyNameMap[this.getID()] ?? 'Unknown-Setting';
  }

  toString(): string {
    return this.value;
  }

  isSystemProperty() {
    return (this.id & kPropertyScopeMask) === kPropertyScopeMask;
  }

  isTitleSpecific() {
    return (this.id & kTitleSpecificMask) === kTitleSpecificMask;
  }

  toStringPretty() {
    return `Type: ${!this.isTitleSpecific() ? 'Dashboard' : 'Title'}  ID:\t0x${this.getIDHexString()}  Data Type: ${this.getType()}  Size: ${this.getSizeFromType()}`;
  }
}

export const DefaultGamerpic = new UserSetting(
  'QGQADwAAAAAEAAAAAAAAAAAAADIwA5AAAEYARgBGAEUAMAA3AEQAMQAwADAAMAAyADAAMAAwADkAMAAwADAAMQAwADAAMAA5AAA=',
);
