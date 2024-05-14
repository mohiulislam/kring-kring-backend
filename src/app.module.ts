import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupModule } from './group/group.module';
import { MessageModule } from './message/message.module';
import { JwtUserAuthenticationMiddleware } from './middlewares/auth.middleware';
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
    ChatModule,
    GroupModule,
    MessageModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtUserAuthenticationMiddleware).forRoutes('*');
  }
}
