// Response shape of GET /sessions (see AggregateSessionCommandHandler)

interface SessionsMetadata {
  HEROKU_RELEASE_CREATED_AT?: string;
  HEROKU_BUILD_COMMIT?: string;
  START_TIME?: string;
}

interface PlayerInfo {
  gamertag: string;
  gamerpic: string;
}

interface SessionInfo {
  mediaId: string;
  version: string;
  players: PlayerInfo[];
  total: number;
  host_presence: string;
  host_gamertag: string;
  host_xuid?: string;
}

interface TitleSessions {
  titleId: string;
  name: string;
  icon: string;
  sessions: SessionInfo[];
}

interface SessionsResponse {
  Titles: TitleSessions[];
  Metadata?: SessionsMetadata;
}
