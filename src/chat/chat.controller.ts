import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiSecurity } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { ChatService } from './chat.service';

@Controller('chat')
@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private chatService: ChatService,
  ) {}
  @Get()
  async getGroups(@Req() req) {
    const decoded = await this.authService.verifyJWTBearerToken(
      req.headers.authorization,
      this.configService.get('JWT_SECRET'),
    );
    return this.chatService.getGroups(decoded.sub);
  }
}
