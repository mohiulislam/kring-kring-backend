import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { Group, GroupSchema } from 'src/schema/schema';

import { GroupMessageController } from './group-message.controller';
import { MessageService } from './group-message.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  controllers: [GroupMessageController],
  providers: [MessageService],
})
export class GroupMessageModule {}
