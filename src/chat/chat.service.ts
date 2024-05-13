import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getGroups(userId) {
    const user = await this.userModel.find({ _id: userId }).populate('groups');
    console.log(user);
    return user;
  }
}
