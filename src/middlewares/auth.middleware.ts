import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class JwtUserAuthenticationMiddleware implements NestMiddleware {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      throw new UnauthorizedException();
    }
    const decoded = await this.authService.verifyJWT(
      bearerToken,
      this.configService.get('JWT_SECRET'),
    );
    if (!decoded) {
      throw new UnauthorizedException();
    }

    req.user = decoded;
    next();
  }
}
