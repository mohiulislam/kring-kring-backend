import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiSecurity } from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { GroupService } from './group.service';

@Controller('groups')
@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class GroupController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private groupService: GroupService,
  ) {}
  @Get()
  async getGroups(@Req() req) {
    const decoded = await this.authService.verifyJWTBearerToken(
      req.headers.authorization,
      this.configService.get('JWT_SECRET'),
    );
    return this.groupService.getGroups(decoded.sub);
  }
}
