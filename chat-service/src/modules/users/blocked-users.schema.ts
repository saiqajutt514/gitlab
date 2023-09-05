import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'blocked_users', timestamps: true, versionKey: '_vs' })
export class BlockedUsers extends Document {

  @Prop({ required: true })
  userId: number;

  @Prop()
  blockedId: number;
}

export const BlockedUsersSchema = SchemaFactory.createForClass(BlockedUsers);
