import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { Group, GroupSchema, User, UserSchema } from 'src/schema/schema';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Group.name, schema: GroupSchema },
    ]),
  ],
  providers: [GroupService],
  controllers: [GroupController],
})
export class GroupModule {}
