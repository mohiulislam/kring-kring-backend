import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength
} from 'class-validator';

export class RegisterByEmailDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: 'mohiulislam900@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
  
  @ApiProperty({
    type: 'string',
    required: true,
    example: '12345678',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
