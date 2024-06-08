import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGroupPayloadDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;
}
