import { IsNotEmpty, IsString } from 'class-validator';

export class MessagePayloadDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
