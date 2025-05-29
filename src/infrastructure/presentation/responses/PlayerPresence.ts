export interface PlayerPresence {
  xuid: string;
  gamertag: string;
  state: number;
  sessionId: string;
  titleId: string;
  stateChangeTime: number;
  richPresence: string;
}

// TODO:
// ftUserTime;
// xnkidInvite;
// gameinviteTime;

export type GetPlayerPresence = PlayerPresence[];
