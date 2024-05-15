import { Controller, Get, HttpException, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MessageService } from './group-message.service';

@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('group-message')
@ApiTags('Group message')
export class GroupMessageController {
  constructor(private messageService: MessageService) {}
  @Get(":id")
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: '63f2a7a0b0b0b0b0b0b0b0b0',
    description: 'The unique identifier of the group.',
  })
  getGroupMessages(@Param('id') id) {
    return this.messageService.getGroupMessages(id);
  }
}
