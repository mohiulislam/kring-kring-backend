import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group } from 'src/schema/schema';

@Injectable()
export class MessageService {
  constructor(@InjectModel(Group.name) private groupModel: Model<Group>) {}
  async getGroupMessages(id) {

    
    const group =await  this.groupModel.findById(id).populate('messages'); ;
    
    return group.messages; ;
  }
}
