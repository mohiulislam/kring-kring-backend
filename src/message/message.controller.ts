import { Controller, Get, UseGuards } from '@nestjs/common';
import { Sub } from 'src/decorators/sub.decorator';
import { MessageService } from './message.service';
import { ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('user/message')
export class MessageController {
  constructor(private messageService: MessageService) {}
  @Get()
  async getMessages(@Sub() sub) {
    return this.messageService.getMessages(sub);
  }
}
