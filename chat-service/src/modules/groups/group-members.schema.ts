import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'group_members', timestamps: true, versionKey: '_vs' })
export class GroupMembers extends Document {

  @Prop({ required: true })
  groupId: string;

  @Prop()
  memberId: number;

  @Prop()
  memberType: number;

  @Prop({ required: true })
  createdBy: number;

  @Prop({ required: true })
  modifiedBy: number;

  @Prop()
  isDeleted: Date;

}

export const GroupMembersSchema = SchemaFactory.createForClass(GroupMembers);
