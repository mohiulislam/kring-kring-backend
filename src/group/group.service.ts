import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/schema';

@Injectable()
export class GroupService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getGroups(userId) {
    const user = await this.userModel
      .findOne({ _id: userId })
      .populate({ path: 'groups', populate: { path: 'users' } });

    return user.groups;
  }
}
