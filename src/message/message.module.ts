import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { User, UserSchema } from 'src/schema/schema';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [ AuthModule,ConfigModule,MongooseModule.forFeature([{ name: User.name, schema: UserSchema}])],
  controllers: [MessageController],
  providers: [MessageService]
})
export class MessageModule {}
