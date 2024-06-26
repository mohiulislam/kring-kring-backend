import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from 'src/schema/schema';

@Injectable()
export class MessageService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) {}

  async getGroupMessages({ groupId, pageNumber, pageSize, userId }) {
    const skip = (pageNumber - 1) * pageSize;
    const group = await this.groupModel.findById(groupId);
    if (
      !group.users.some((user) => {
        return user.toString() === userId.toString();
      })
    ) {
      throw new NotFoundException(`User ${groupId} is not part of the group.`);
    }
    const messages = (
      await group.populate({
        path: 'messages',
        select: 'user content createdAt -_id',
        options: {
          sort: { createdAt: -1 }, 
        },
      })
    ).messages;
    const paginatedMessages = messages.slice(skip, skip + pageSize);
    return paginatedMessages;
  } 
}
