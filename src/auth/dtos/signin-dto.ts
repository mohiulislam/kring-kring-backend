import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    type: String,
    example: 'mohiulislam5@gmail.com',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    type: String,
    example: '12345678',
  })
  @IsNotEmpty()
  password: string;
}
