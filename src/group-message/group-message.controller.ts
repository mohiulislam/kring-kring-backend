import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiParam, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MessageService } from './group-message.service';
import { Sub } from 'src/decorators/sub.decorator';

@ApiSecurity('JWT-auth')
@UseGuards(AuthGuard('jwt'))
@Controller('group-message')
@ApiTags('Group message')
export class GroupMessageController {
  constructor(private messageService: MessageService) {}

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    example: '664431ba3db05983cba120ff',
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
    example: '3',
    description: 'Size of each page for pagination',
  })
  getGroupMessages(
    @Param('id') id,
    @Query('pageNumber') pageNumber: string,
    @Query('pageSize') pageSize: string,
    @Sub() userId,
  ) {
    const pageNumberNumber = Number(pageNumber);
    const pageSizeNumber = Number(pageSize);

    if (isNaN(pageNumberNumber) || isNaN(pageSizeNumber)) {
      throw new Error('Invalid input for pageNumber or pageSize');
    }

    return this.messageService.getGroupMessages({
      groupId: id,
      pageNumber: pageNumberNumber,
      pageSize: pageSizeNumber,
      userId,
    });
  }
}
