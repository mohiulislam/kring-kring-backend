import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Sub } from 'src/decorators/sub.decorator';
import { GroupService } from './group.service';

@Controller('groups')
@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Group')
export class GroupController {
  constructor(private groupService: GroupService) {}
  @Get()
  async getGroups(@Sub() sub) {
    return this.groupService.getGroups(sub);
  }
}
