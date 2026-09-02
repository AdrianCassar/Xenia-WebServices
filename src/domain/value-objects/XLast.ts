export interface SupportedLocale {
  locale: string;
}

export interface Translation {
  locale: string;
  '#text': string; // simpleContent text value mapping
}

export interface LocalizedString {
  clsid?: string;
  friendlyName?: string;
  id?: number;
  Translation: Translation[];
  Presence?: any;
}

export interface LocalizedStrings {
  clsid?: string;
  nextId?: number;
  defaultLocale?: string;
  SupportedLocale: SupportedLocale[];
  LocalizedString: LocalizedString[];
}

export interface Privilege {
  name:
    | 'XPRIVILEGE_PII_ACCESS'
    | 'XPRIVILEGE_WP7_LIVE_MULTIPLAYER'
    | 'XPRIVILEGE_GFWL_SSA';
}

export interface Privileges {
  Privilege?: Privilege[];
}

export interface GameMode {
  value?: number;
  stringId?: number;
  friendlyName?: string;
  drawProbability: number;
}

export interface GameModes {
  clsid?: string;
  defaultValue?: number;
  GameMode?: GameMode[];
}

export interface ContextValue {
  value?: number;
  stringId?: number;
  friendlyName?: string;
}

export interface Context {
  clsid?: string;
  defaultValue?: number;
  friendlyName?: string;
  id?: number;
  stringId?: number;
  ContextValue?: ContextValue[];
}

export interface Contexts {
  clsid?: string;
  nextId?: number;
  Context?: Context[];
}

export interface ImageElement {
  friendlyName?: string;
  id?: number;
  Path: string;
}

export interface Images {
  clsid?: string;
  Image?: ImageElement[];
}

export interface Achievement {
  achievementType?:
    | 'Completion'
    | 'Leveling'
    | 'Unlock'
    | 'Event'
    | 'Tournament'
    | 'Checkpoint'
    | 'Other';
  clsid?: string;
  descriptionStringId?: number;
  friendlyName?: string;
  id?: number;
  imageId?: number;
  showUnachieved?: boolean;
  titleStringId?: number;
  unachievedStringId?: number;
  webDescriptionStringId?: number;
  cred?: number;
}

export interface Achievements {
  clsid?: string;
  nextId?: number;
  Achievement?: Achievement[];
}

export interface AvatarItem {
  clsid?: string;
  id?: number;
  showUnachieved?: boolean;
  unachievedStringId?: number;
  descriptionStringId?: number;
  friendlyName?: string;
  guid1?: string;
  imageId1?: number;
  displayStringId1?: number;
  subCategory1?: number;
  binLocation1?: string;
  binLocation1v2?: string;
  imageMedLocation1?: string;
  guid2?: string;
  imageId2?: number;
  displayStringId2?: number;
  subCategory2?: number;
  binLocation2?: string;
  binLocation2v2?: string;
  imageMedLocation2?: string;
}

export interface AvatarItems {
  clsid?: string;
  nextId?: number;
  AvatarItem?: AvatarItem[];
}

export interface PropertyFormat {
  decimals?: number;
  year?: boolean;
  month?: boolean;
  day?: boolean;
  hours?: boolean;
  minutes?: boolean;
  seconds?: boolean;
  milliseconds?: boolean;
}

export interface PropertyElement {
  clsid?: string;
  dataSize?: number;
  id?: number;
  friendlyName?: string;
  stringId?: number;
  DefaultValue?: number;
  Format?: PropertyFormat;
}

export interface Properties {
  clsid?: string;
  nextId?: number;
  Property?: PropertyElement[];
}

export interface PresenceMode {
  clsid?: string;
  contextValue?: number;
  stringId?: number;
  friendlyName?: string;
}

export interface Presence {
  clsid?: string;
  nextContextValue?: number;
  PresenceMode?: PresenceMode[];
}

export interface Aggregation {
  type?: 'Min' | 'Max' | 'Sum' | 'Last';
}

export interface PropertyField {
  id?: number;
  Aggregation: Aggregation;
}

export interface ContextField {
  id?: number;
}

export interface ViewField {
  attributeId?: number;
  friendlyName?: string;
  hidden?: boolean;
  stringId?: number;
  ordinal?: number;
  arcadeLeaderboard?: boolean;
  arcadeSort?: 'Ascending' | 'Descending';
  arcadeStringId?: number;
  isDerivedFromMaster?: boolean;
  Context?: ContextField;
  Property?: PropertyField;
}

export interface ColumnsAxis {
  Field: ViewField[];
}

export interface StatsView {
  friendlyName?: string;
  clsid?: string;
  id?: number;
  resetType?:
    'Weekly' | 'Biweekly' | 'Monthly' | 'Bimonthly' | 'Annually' | 'Never';
  stringId?: number;
  entryExpiration?: number;
  topEntries?: number;
  platformVisible?: 'enabled' | 'primary';
  platformVisibleRatingAttributeId?: number;
  arbitrated?: boolean;
  hidden?: boolean;
  maxAttachments?: number;
  onlineOnly?: boolean;
  flipAxes?: boolean;
  viewType?: string;
  masterId?: number;
  Columns: ColumnsAxis;
}

export interface StatsViewMaster extends Omit<
  StatsView,
  'masterId' | 'platformVisible' | 'platformVisibleRatingAttributeId'
> {
  resetTypeIsAny?: boolean;
  entryExpirationIsAny?: boolean;
  topEntriesIsAny?: boolean;
  arbitratedIsAny?: boolean;
  hiddenIsAny?: boolean;
  maxAttachmentsIsAny?: boolean;
}

export interface StatsViews {
  clsid?: string;
  nextViewId?: number;
  StatsView?: StatsView[];
}

export interface StatsViewMasters {
  clsid?: string;
  nextViewId?: number;
  StatsView?: StatsViewMaster[];
}

export interface MatchmakingAttribute {
  id?: number;
  minValue?: number;
  maxValue?: number;
}

export interface MatchmakingConstant {
  name?: string;
  id?: number;
  value?: number;
}

export interface MatchmakingParameter {
  id?: number;
  weighted?: boolean;
  exactMatch?: boolean;
}

export interface MatchmakingFilter {
  left?: number;
  leftType?: 'Attribute' | 'Parameter' | 'Constant' | 'ContextValue';
  op?: string;
  right?: number;
  rightType?: 'Attribute' | 'Parameter' | 'Constant' | 'ContextValue';
}

export interface SortOperation {
  id?: number;
  ordinal?: number;
  type?: 'Ascending' | 'Descending' | 'Near' | 'Far';
  distanceid?: number;
}

export interface MatchmakingReturn {
  id?: number;
  type?: 'Normal' | 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'Count';
  ordinal?: number;
}

export interface MatchmakingQuery {
  clsid?: string;
  id?: number;
  friendlyName?: string;
  maxResults?: number;
  type?: 'Normal' | 'Findfromid' | 'Aggregate';
  qosProbe?: boolean;
  groupBy?: number;
  Parameters: { Parameter?: MatchmakingParameter[] };
  Filters: { Filter?: MatchmakingFilter[] };
  SortOperations: { SortOperation?: SortOperation[] };
  Returns: { Return?: MatchmakingReturn[] };
}

export interface MatchmakingSchema {
  clsid?: string;
  Attribute?: MatchmakingAttribute[];
}

export interface MatchmakingConstants {
  clsid?: string;
  nextId?: number;
  Constant?: MatchmakingConstant[];
}

export interface MatchmakingQueries {
  clsid?: string;
  nextId?: number;
  Query?: MatchmakingQuery[];
}

export interface Matchmaking {
  clsid?: string;
  isV1Title?: boolean;
  Schema: MatchmakingSchema;
  Constants: MatchmakingConstants;
  Queries: MatchmakingQueries;
}

export interface Rating {
  ratingSystemId?: number;
  ratingId?: number;
  imageId?: number;
  Description?: string;
}

export interface Genre {
  genreId?: number;
}

export interface Feature {
  name?: string;
  enabled?: boolean;
}

export interface Platform {
  name?: string;
  id?: number;
}

export interface ProductInformation {
  offlinePlayersMax?: number;
  systemLinkPlayersMax?: number;
  livePlayersMax?: number;
  shortDescriptionStringId?: number;
  sellTextStringId?: number;
  publisherStringId?: number;
  developerStringId?: number;
  genreTextStringId?: number;
  arcadeDescriptionStringId?: number;
  Rating?: Rating[];
  Genre?: Genre[];
  Feature?: Feature[];
  Platform?: Platform[];
}

export interface GamerPicture {
  friendlyName?: string;
  id?: number;
}

export interface GamerPictures {
  clsid?: string;
  Picture?: GamerPicture[];
}

export interface FriendStatsView {
  friendlyName?: string;
  stringId?: number;
  id?: number;
  platformVisible?: 'enabled' | 'primary';
  bestOutcome?: 'BestScore' | 'BestTime';
  bestOutcomeSortOrder?: 'Ascending' | 'Descending';
}

export interface FriendStatsViews {
  FriendStatsView?: FriendStatsView[];
}

export interface GameConfigProject {
  clsid?: string;
  titleId?: number;
  titleName?: string;
  titleType?: number;
  multiplayer?: string;
  name?: string;
  projectVersion?: string;
  schemaVersion?: string;
  arn?: string;
  validateAgainst?: string;
  classification?:
    'BaseGame' | 'DLC' | 'NewSKU' | 'TitleUpdate' | 'ConfigOnlyUpdate';
  LocalizedStrings: LocalizedStrings;
  Privileges?: Privileges;
  GameModes?: GameModes;
  Contexts?: Contexts;
  Images?: Images;
  Achievements?: Achievements;
  AvatarItems?: AvatarItems;
  Properties?: Properties;
  Presence?: Presence;
  StatsViews?: StatsViews;
  StatsViewMasters?: StatsViewMasters;
  Matchmaking?: Matchmaking;
  ProductInformation?: ProductInformation;
  GamerPictures?: GamerPictures;
  FriendStatsViews?: FriendStatsViews;
}

export interface XboxLiveSubmissionProjectXML {
  XboxLiveSubmissionProject: {
    Version?: string;
    GameConfigProject: GameConfigProject;
  };
}
