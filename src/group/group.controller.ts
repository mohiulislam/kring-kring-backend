import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiSecurity } from '@nestjs/swagger';
import { Sub } from 'src/decorators/sub.decorator';
import { GroupService } from './group.service';

@Controller('user/groups')
@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class GroupController {
  constructor(private groupService: GroupService) {}
  @Get()
  async getGroups(@Sub() sub) {
    return this.groupService.getGroups(sub);
  }
}
