import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResourcesDocument = Resources & Document;

@Schema({ timestamps: true })
export class Resources {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  wood: number;

  @Prop({ type: Number, default: 0 })
  stone: number;

  @Prop({ type: Number, default: 0 })
  gold: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ResourcesSchema = SchemaFactory.createForClass(Resources);