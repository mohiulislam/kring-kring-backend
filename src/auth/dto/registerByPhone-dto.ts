import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, Length, MinLength } from 'class-validator';

export class RegisterByPhoneDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: '+880161196980',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    type: 'string',
    required: true,
    example: '12345678',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
