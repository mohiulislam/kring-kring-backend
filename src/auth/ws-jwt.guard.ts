import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { log } from 'console';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.query.token;
    const decoded = await this.authService.verifyJWT(
      token,
      this.configService.get('JWT_SECRET'),
    );
    client.handshake.headers.user = decoded;
    return decoded;
  }
}
