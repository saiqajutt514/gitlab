import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: '_vs' })
export class Conversations extends Document {

  @Prop({ required: true })
  initiator: number;

  @Prop()
  receivers: [{
    userId: number,
    lastActionAt?: Date,
    lastActionBy?: number,
    lastActionType?: number,
    lastActionContent?: string
  }]

  @Prop()
  groupId: string;

  @Prop()
  chatType: number;

  @Prop()
  lastMessageBy: number;

  @Prop()
  lastMessageType: number;

  @Prop()
  lastMessageContent: string;

  @Prop()
  deletedFor?: [{
    userId?: number
  }]

  @Prop()
  archivedFor?: [{
    userId?: number
  }]
}

export const ConversationsSchema = SchemaFactory.createForClass(Conversations);
