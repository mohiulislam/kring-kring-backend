import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'mohiulislam9@gamil.com',
  })
  @IsNotEmpty()
  @IsString()
  participantUserName: string;
}
