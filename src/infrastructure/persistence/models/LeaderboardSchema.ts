import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LeaderboardDocument = Leaderboard & Document;

@Schema()
export class Leaderboard {
  @Prop({ required: true })
  id: string;
  @Prop({ required: true })
  titleId: string;
  @Prop({ required: true })
  player: string;
  @Prop({ required: true, type: Object })
  // eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
  stats: Object;
}

export const LeaderboardSchema = SchemaFactory.createForClass(Leaderboard);

LeaderboardSchema.index({ id: 1, titleId: 1, player: 1 }, { unique: true });
