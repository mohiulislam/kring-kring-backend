import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, SchemaTypes } from 'mongoose';

export enum MediaType {
  photo = 'photo',
  video = 'video',
  audio = 'audio',
}

export enum GroupRole {
  admin = 'admin',
  member = 'member',
}

@Schema()
export class ContactInfo {
  @Prop({ type: String, required: false, unique: true, sparse: true })
  email: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  phone: string;
}

@Schema()
export class User {
  @Prop({ type: String, required: true, unique: true })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: false })
  profilePhoto?: string;

  @Prop({ type: Boolean, default: false })
  isOnline: boolean;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'Message' }])
  messages: MongooseSchema.Types.ObjectId[];

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'Group' }])
  groups: MongooseSchema.Types.ObjectId[];

  @Prop({ type: ContactInfo, ref: 'ContactInfo' })
  contactInfo: ContactInfo;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

@Schema()
export class OTP {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: Date, default: () => Date.now() - 60000 })
  expireAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

@Schema()
export class Group {
  @Prop({ type: String, required: false })
  name: string;

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'User' }])
  users: MongooseSchema.Types.ObjectId[];

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'Message' }])
  messages: MongooseSchema.Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Message' })
  lastMessage?: MongooseSchema.Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  admin: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

@Schema()
export class Media {
  @Prop({ type: String, required: false, unique: true, sparse: true })
  url: string;

  @Prop({ type: String, required: false, unique: true, sparse: true })
  mediaType: string;
}

@Schema()
export class Message {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User' })
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Group' })
  group: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Media, ref: 'Media' })
  media: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const MessageSchema = SchemaFactory.createForClass(Message);
export const GroupSchema = SchemaFactory.createForClass(Group);
export const OTPSchema = SchemaFactory.createForClass(OTP);
