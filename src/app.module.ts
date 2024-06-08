import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { GroupMessageModule } from './group-message/group-message.module';
import { GroupModule } from './group/group.module';
import { RealtimeChatModule } from './realtime-chat/realtime-chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('DATABASE_URL');
        return {
          uri,
        };
      },
    }),
    AuthModule,
    RealtimeChatModule,
    GroupModule,
    GroupMessageModule,
    EmailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
