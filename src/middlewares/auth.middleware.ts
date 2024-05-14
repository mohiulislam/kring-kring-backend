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

  use(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;
    const decoded = this.authService.verifyJWTBearerToken(
      bearerToken,
      this.configService.get('JWT_SECRET'),
    );
    if (!decoded) {
      return res.status(401).send('Unauthorized');
    }
      req.user = decoded;
      console.log(555555555555);
      
    next();
  }
}
