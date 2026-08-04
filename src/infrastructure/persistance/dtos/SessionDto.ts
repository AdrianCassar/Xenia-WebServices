export interface SessionDto {
  id: string;
  flags: number;
  hostAddress: string;
  localAddress?: string;
  onlineAddress?: string;
  port: number;
  macAddress: string;
  publicSlotsCount: number;
  privateSlotsCount: number;
  openPublicSlotsCount: number;
  openPrivateSlotsCount: number;
  filledPublicSlotsCount: number;
  filledPrivateSlotsCount: number;
}
