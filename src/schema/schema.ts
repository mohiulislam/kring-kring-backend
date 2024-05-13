import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

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

  @Prop({ type: Boolean, default: false })
  isOnline: boolean;

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'Message' }])
  messages: Message[];

  @Prop([{ type: SchemaTypes.ObjectId, ref: 'Group' }])
  groups: Group[];

  @Prop({ type: ContactInfo, ref: 'ContactInfo' })
  contactInfo: ContactInfo;

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
  users: User[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

@Schema()
export class GroupUser {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User' })
  user: User;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Group' })
  group: Group;

  @Prop({ type: String, enum: GroupRole, required: true })
  role: GroupRole;

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
  group: Group;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Media, ref: 'Media' })
  media: Media;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const MessageSchema = SchemaFactory.createForClass(Message);
export const GroupSchema = SchemaFactory.createForClass(Group);
export const GroupUserSchema = SchemaFactory.createForClass(GroupUser);
