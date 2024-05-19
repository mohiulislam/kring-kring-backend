import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtAuthGuard } from 'src/auth/ws-jwt.guard';
import { Group, GroupUser, Message, User } from 'src/schema/schema';
import { JoinGroupPayloadDto } from './dtos/join-payload.dto';
import { MessagePayloadDto } from './dtos/message-payload-dto';
@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ namespace: 'chatWS' })
@UsePipes(new ValidationPipe())
export class RealtimeChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(GroupUser.name) private groupUserModel: Model<GroupUser>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private connectedClientsSockets = new Map<
    string,
    { socket: Socket; user: User }
  >();
  private socketToUserIdMap = new Map<string, string>();

  async handleConnection(@ConnectedSocket() client: Socket) {
    
    const { authorization } = client.handshake.headers;
    if (!authorization) {
      client.disconnect();
      return;
    }
    const decoded = await this.authService.verifyJWTBearerToken(
      authorization,
      this.configService.get('JWT_SECRET'),
    );

    if (decoded) {
      const { sub } = decoded;
      const user = await this.userModel.findById(sub);
      if (user) {
        this.socketToUserIdMap.set(client.id, sub);
        this.connectedClientsSockets.set(sub, { socket: client, user });
        return;
      } else {
        console.error('User not found:', sub);
        client.disconnect();
      }
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUserIdMap.get(client.id);
    if (userId) {
      this.connectedClientsSockets.delete(userId);
      this.socketToUserIdMap.delete(client.id);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinGroupWithParticipant')
  async handleJoinGroup(
    @MessageBody() { participantUserName }: JoinGroupPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.handshake.headers.user;

    if (user['username'] === participantUserName) {
      return;
    }
    const participant = await this.userModel.findOne({
      username: participantUserName,
    });

    const existingGroupWithParticipant = await this.groupModel.findOne({
      $and: [
        { users: { $in: user['sub'] } },
        { users: { $in: [participant._id] } },
      ],
    });

    if (
      existingGroupWithParticipant &&
      this.connectedClientsSockets.get(participant._id.toString())
    ) {
      const groupId = existingGroupWithParticipant._id;
      if (participant) {
        const participantClient = this.connectedClientsSockets.get(
          participant._id.toString(),
        );
        client.join(groupId.toString());
        participantClient.socket.join(groupId.toString());
        console.log(groupId.toString());
      } else {
        console.error('Participant client are not registered');
      }
    } else {
      if (participant) {
        const participantClient = this.connectedClientsSockets.get(
          participant._id.toString(),
        );

        if (participantClient) {
          client.join(participant._id.toString());
          participantClient.socket.join(participant._id.toString());
        } else {
          client.emit('error', 'Your buddy is not online');
          console.error('Participant client is not online');
        }

        const group = await this.groupModel.create({
          users: [user['sub'], participant._id],
        });
        console.log(group._id.toString());
        this.groupUserModel.create({
          user: user['sub'],
          group: group._id,
          role: 'admin',
        });
        this.groupUserModel.create({
          user: participant._id,
          group: group._id,
          role: 'member',
        });
        await this.userModel.findByIdAndUpdate(user['sub'], {
          $push: {
            groups: group._id,
          },
        });
      }
    }
    console.log(this.server);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() { message, groupId }: MessagePayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sub = client.handshake.headers.user['sub'];

    if (1) {
      this.server.to(groupId).emit('message', {
        content: message,
        groupId: groupId,
        user: {
          firstName: this.connectedClientsSockets.get(sub).user.firstName,
          lastName: this.connectedClientsSockets.get(sub).user.lastName,
        },
      });
    } else {
      client.emit('error', 'Your buddy is not online');
      console.error('Participant client is not online');
    }

    const savedMessage = await this.messageModel.create({
      user: sub,
      content: message,
      group: groupId,
    });
    await this.userModel.findByIdAndUpdate(sub, {
      $push: {
        messages: savedMessage._id,
      },
    });
    await this.groupModel.findByIdAndUpdate(groupId, {
      $push: {
        messages: savedMessage._id,
      },
      $set: {
        lastMessage: savedMessage._id,
      },
    });
  }
}
