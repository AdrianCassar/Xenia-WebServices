export interface SessionDetailsDto {
  title: string;
  version: string;
  mediaId: string;
  xuid: string;
  id: string;
  flags: number;
  hostAddress: string;
  port: number;
  macAddress: string;
  publicSlotsCount: number;
  privateSlotsCount: number;
  openPublicSlotsCount: number;
  openPrivateSlotsCount: number;
  filledPublicSlotsCount: number;
  filledPrivateSlotsCount: number;
}
