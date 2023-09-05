import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: '_vs' })
export class Messages extends Document {

  @Prop({ required: true })
  senderId: number;

  @Prop({ required: true })
  messageId: string;

  @Prop()
  timestamp: number;

  @Prop()
  groupId: string;

  @Prop()
  conversationId?: string;

  @Prop()
  chatType: number;

  @Prop()
  messageType: number;

  @Prop()
  messageContent: string;

  @Prop()
  status: number;

  @Prop()
  receiverId: number

  @Prop()
  isDeleted: Date;

  //Added
  @Prop()
  readAt: Date;

  //Added
  @Prop()
  deliveredAt: Date;

  @Prop( { type: Object })
  metadata?: { url?: string, mime?: string, previewUrl?:string, lat?:number, long?:number, amount?:number, address?: string, addressTitle?: string, transactionId?:string, status?:number }
}

export const MessagesSchema = SchemaFactory.createForClass(Messages);
