import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BuildingDocument = Building & Document;

@Schema({ timestamps: true })
export class Building {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: string; // Тип здания, например: 'castle', 'farm', 'barracks'

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const BuildingSchema = SchemaFactory.createForClass(Building);