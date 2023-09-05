import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { USER_STATUS } from './users.enum';
@Schema({ timestamps: true, versionKey: '_vs' })
export class Users extends Document {

  @Prop({ required: true })
  userId: number;

  @Prop()
  firstName: string;

  @Prop()
  firstNameArabic: string;

  @Prop()
  lastName: string;

  @Prop()
  lastNameArabic: string;

  @Prop()
  englishName: string;

  @Prop()
  arabicName: string;

  @Prop()
  emailId: string;

  @Prop()
  mobileNo: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  gender: string;

  @Prop()
  profileImage: string;

  @Prop()
  deviceId: string;

  @Prop()
  deviceName: string;

  @Prop()
  deviceToken: string;

  @Prop()
  clientOs: string;

  @Prop()
  prefferedLanguage: string;

  @Prop()
  appVersion: string;

  @Prop()
  isOnline: boolean;

  @Prop()
  lastSeenAt: Date;

  @Prop()
  mutedChat: string[];

  @Prop({ default: USER_STATUS.ACTIVE })
  status: number

  @Prop()
  reason: string
}

export const UsersSchema = SchemaFactory.createForClass(Users);
