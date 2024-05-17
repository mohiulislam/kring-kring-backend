import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { GroupMessageController } from './group-message/group-message.controller';
import { GroupMessageModule } from './group-message/group-message.module';
import { GroupController } from './group/group.controller';
import { GroupModule } from './group/group.module';
import { JwtUserAuthenticationMiddleware } from './middlewares/auth.middleware';
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
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtUserAuthenticationMiddleware).forRoutes(GroupController,GroupMessageController);
  }
}
