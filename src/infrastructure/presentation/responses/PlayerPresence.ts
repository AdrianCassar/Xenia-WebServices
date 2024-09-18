export interface PlayerPresence {
  xuid: string;
  gamertag: string;
  state: number;
  sessionId: string;
  titleId: string;
  stateChangeTime: number;
  richPresenceStateSize: number; // Not needed can determine size from string itself.
  richPresence: string;
}

// TODO:
// ftUserTime;
// xnkidInvite;
// gameinviteTime;

export type GetPlayerPresence = PlayerPresence[];
