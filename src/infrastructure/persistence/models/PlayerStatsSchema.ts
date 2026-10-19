import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class StatsColumn {
  // Column attribute id (ordinal) defined by the title's SPA/XLast.
  @Prop({ type: Number, required: true })
  attribute_id: number;

  // Base64 serialized XUSER_PROPERTY.
  @Prop({ type: String, required: true })
  property: string;
}

export const StatsColumnSchema = SchemaFactory.createForClass(StatsColumn);

// A single leaderboard row: one player within one view of a title.
@Schema({ timestamps: true })
export class PlayerStats {
  @Prop({ type: String, required: true })
  title_id: string;

  @Prop({ type: Number, required: true })
  view_id: number;

  @Prop({ type: String, required: true })
  xuid: string;

  // Last known gamertag, player documents expire so keep a copy.
  @Prop({ type: String, required: true })
  gamertag: string;

  // Value of the rating column (RatingAttributeId) used to rank rows.
  @Prop({ type: BigInt, required: true, default: 0n })
  rating: bigint;

  @Prop({ type: [StatsColumnSchema], required: true, default: [] })
  columns: StatsColumn[];

  // End of the leaderboard period for views that reset (XLast resetType),
  // null for views that never reset. Expired rows are removed by MongoDB.
  @Prop({ type: Date, required: false, default: null })
  expires_at: Date | null;
}

export type PlayerStatsDocument = PlayerStats & Document;

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);

PlayerStatsSchema.index({ title_id: 1, view_id: 1, xuid: 1 }, { unique: true });
PlayerStatsSchema.index({ title_id: 1, view_id: 1, rating: -1, _id: 1 });
PlayerStatsSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
