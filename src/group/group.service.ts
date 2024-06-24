import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { log } from 'console';
import { Model } from 'mongoose';
import { User } from 'src/schema/schema';

@Injectable()
export class GroupService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getGroups(userId) {
    console.log(userId);

    const user = await this.userModel.findOne({ _id: userId }).populate([
      {
        path: 'groups',
        select: '-messages',
        populate: [
          {
            path: 'users',
            select: 'firstName lastName profilePhoto isOnline verified',
          },
          { path: 'lastMessage' },
        ],
      },
    ]);
    if (!user?.groups) {
      throw new NotFoundException('Resource not found');
    }
    return user.groups;
  }
}
