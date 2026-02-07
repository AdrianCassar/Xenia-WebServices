export interface PlayerSettings {
  xuid: string;
  settings: Map<string, Map<string, Array<string>>>;
}

export type GetPlayersSettings = Array<PlayerSettings>;
