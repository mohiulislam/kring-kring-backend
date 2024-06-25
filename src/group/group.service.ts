import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, User } from 'src/schema/schema';

@Injectable()
export class GroupService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Group.name) private groupModel: Model<Group>,
  ) {}
  async getGroups(userId) {
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

  async createGroup({ participantUserName, userId }) {
    const participant = await this.userModel.findOne({
      username: participantUserName,
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const existingGroupWithParticipant = await this.groupModel.findOne({
      $and: [{ users: { $in: userId } }, { users: { $in: [participant._id] } }],
    });

    if (existingGroupWithParticipant) {
      throw new NotFoundException('participant already in group');
    }

    const group = await this.groupModel.create({
      users: [userId, participant._id],
      admin: userId,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        groups: group._id,
      },
    });
    console.log(participant._id);

    await this.userModel.findByIdAndUpdate(participant._id, {
      $push: {
        groups: group._id,
      },
    });

    return group.populate({
      path: 'users',
      select: 'firstName lastName isOnline',
    });
  }
}
