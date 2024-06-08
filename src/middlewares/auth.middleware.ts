import { Injectable, NestMiddleware } from '@nestjs/common';
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
      return res.status(401).send('Unauthorized');
    }
    const decoded = await this.authService.verifyJWT(
      bearerToken,
      this.configService.get('JWT_SECRET'),
    );
    if (!decoded) {
      return res.status(401).send('Unauthorized');
    }

    req.user = decoded;
    next();
  }
}
