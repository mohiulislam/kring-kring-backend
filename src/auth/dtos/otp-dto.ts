import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { SignInDto } from './signin-dto';

export class OtpDto extends PartialType(SignInDto) {
  @ApiProperty()
  @IsNotEmpty()
  otp: string;
}
