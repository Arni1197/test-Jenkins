import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BattleDocument = Battle & Document;

@Schema({ timestamps: true })
export class Battle {
  @Prop({ type: Types.ObjectId, required: true })
  attackerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  defenderId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  damage: number;

  @Prop({ type: Object, default: {} })
  resourcesStolen: Record<string, number>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const BattleSchema = SchemaFactory.createForClass(Battle);