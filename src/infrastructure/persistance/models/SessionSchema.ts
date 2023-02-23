import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Session {
  @Prop({ required: true, unique: true })
  id: string;
  @Prop({ required: true })
  titleId: string;
  @Prop({ required: true })
  hostAddress: string;
  @Prop({ required: true })
  macAddress: string;
  @Prop({ required: true })
  flags: number;
  @Prop({ required: true })
  advertised: boolean;
  @Prop({ required: true })
  publicSlotsCount: number;
  @Prop({ required: true })
  privateSlotsCount: number;
  @Prop({ required: true })
  port: number;
  @Prop({ required: true })
  players: string[];
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ id: 1, titleId: 1 }, { unique: true });
