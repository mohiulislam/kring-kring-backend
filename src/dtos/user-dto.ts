import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, Length, IsNotEmpty } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({
    type: 'string',
    example: 'Rina',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({
    type: 'string',
    example: 'Khatun',
  })
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    example: 'rinakhatun@gmail.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  @ApiProperty({
    type: 'string',
    example: '12345678',
  })
  password: string;
}
