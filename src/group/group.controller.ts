import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Sub } from 'src/decorators/sub.decorator';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { log } from 'console';

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

  @Post()
  async createGroup(@Sub() sub, @Body() body: CreateGroupDto) {
    log(body);
    return this.groupService.createGroup({
      participantUserName: body.participantUserName,
      userId: sub,
    });
  }
}
