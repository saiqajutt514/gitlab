import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, versionKey: '_vs' })
export class Groups extends Document {

  @Prop({ required: true })
  groupTitle: string;

  @Prop()
  groupImage: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  createdBy: number;

  @Prop({ required: true })
  modifiedBy: number;

  @Prop()
  isDeleted: Date;

}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
