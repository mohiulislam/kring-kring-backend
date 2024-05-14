import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Group,
  GroupSchema,
  GroupUser,
  GroupUserSchema,
  Message,
  MessageSchema,
  User,
  UserSchema,
} from 'src/schema/schema';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      {
        name: GroupUser.name,
        schema: GroupUserSchema,
      },
      {
        name: Message.name,
        schema: MessageSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [ChatGateway],
})
export class ChatModule {}
