import { IsNotEmpty, IsString } from 'class-validator';

export class JoinWithParticipantPayloadDto {
  @IsNotEmpty()
  @IsString()
  participantUserName: string;
}
