import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Group,
  GroupSchema,
  Message,
  MessageSchema,
  User,
  UserSchema,
} from 'src/schema/schema';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RealtimeChatGateway } from './realtime-chat.gateway';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },

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
  providers: [RealtimeChatGateway],
})
export class RealtimeChatModule {}
