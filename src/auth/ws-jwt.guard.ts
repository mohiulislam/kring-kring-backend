import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

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
    const bearerToken = client.handshake.headers.authorization;

    const decoded = await this.authService.verifyJWTBearerToken(
      bearerToken,
      this.configService.get('JWT_SECRET'),
    );
    client.handshake.headers.user = decoded;
    return decoded;
  }
}
