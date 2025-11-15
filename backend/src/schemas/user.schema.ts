import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ default: false })
  twoFactorEnabled: boolean;
  @Prop()
  twoFactorSecret?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);