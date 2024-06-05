import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OTP, OTPSchema, User, UserSchema } from 'src/schema/schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: OTP.name, schema: OTPSchema },
    ]),
  ],
  providers: [EmailService],
    exports: [EmailService],
  
})
export class EmailModule {}
