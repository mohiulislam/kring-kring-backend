import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Sub } from 'src/decorators/sub.decorator';
import { MessageService } from './group-message.service';

@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('group/message')
@ApiTags('Group message')
export class GroupMessageController {
  constructor(private messageService: MessageService) {}

  @Get()
  @ApiQuery({
    name: 'groupId',
    type: String,
    required: true,
    example: '66604d2fecc21e0241eb5383',
    description: 'The unique identifier of the group.',
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    example: '1',
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    example: '5',
    description: 'Size of each page for pagination',
  })
  getGroupMessages(
    @Query('groupId') groupId,
    @Query('pageNumber') pageNumber,
    @Query('pageSize') pageSize,
    @Sub() userId,
  ) {
    const pageNumberNumber = Number(pageNumber);
    const pageSizeNumber = Number(pageSize);

    if (isNaN(pageNumberNumber) || isNaN(pageSizeNumber)) {
      throw new Error('Invalid input for pageNumber or pageSize');
    }
    return this.messageService.getGroupMessages({
      groupId: groupId,
      pageNumber: pageNumberNumber,
      pageSize: pageSizeNumber,
      userId,
    });
  }
}
