import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/schema';

@Injectable()
export class MessageService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async getMessages(sub) {
    const user = await this.userModel.findOne({ _id: sub }).populate('messages');
    return user.messages;
  }
}
