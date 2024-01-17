export interface CreateSessionRequest {
  title: string;
  mediaId: string;
  version: string;
  sessionId: string;
  flags: number;
  publicSlotsCount: number;
  privateSlotsCount: number;
  hostAddress: string;
  macAddress: string;
  port: number;
}
