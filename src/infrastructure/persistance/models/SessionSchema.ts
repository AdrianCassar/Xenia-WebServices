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
  xuid: string;
  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  mediaId: string;
  @Prop({ required: true })
  version: string;
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
  players: Map<string, boolean>;
  @Prop({ required: true, default: false })
  deleted: boolean;
  @Prop({ required: true })
  context: Map<string, number>;
  @Prop({ required: true })
  properties: Array<string>;
  @Prop({ required: false })
  migration: string;

  // How long until Mongodb will automatically delete the document from the collection.
  // Mongodb will check every minute.
  @Prop({
    type: Date,
    expires: '1h',
    required: true,
  })
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ id: 1, titleId: 1 }, { unique: true });
