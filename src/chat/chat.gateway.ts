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
import { JoinGroupPayloadDto } from './dto/join-payload.dto';
import { MessagePayloadDto } from './dto/message-payload-dto';
@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ namespace: 'chatWS' })
@UsePipes(new ValidationPipe())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(GroupUser.name) private groupUserModel: Model<GroupUser>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private clientsSockets = new Map<string, { socket: Socket; user: User }>();
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
        this.clientsSockets.set(sub, { socket: client, user });
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
      this.clientsSockets.delete(userId);
      this.socketToUserIdMap.delete(client.id);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinGroupWithParticipant')
  async handleJoinGroup(
    @MessageBody() payload: JoinGroupPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sub = client.handshake.headers.user['sub'];

    const participant = await this.userModel.findOne({
      username: payload.participantUserName,
    });

    const existingGroupWithParticipant = await this.groupModel.findOne({
      $and: [{ users: { $in: [sub] } }, { users: { $in: [participant._id] } }],
    });

    if (existingGroupWithParticipant) {
      const groupId = existingGroupWithParticipant._id;
      if (participant) {
        const participantClient = this.clientsSockets.get(
          participant._id.toString(),
        );
        client.join(groupId.toString());
        participantClient.socket.join(groupId.toString());
        console.log(groupId.toString());
      } else {
        console.error('Participant client not found');
      }
    } else {
      if (participant) {
        const participantClient = this.clientsSockets.get(
          participant._id.toString(),
        );
        client.join(participant._id.toString());
        participantClient.socket.join(participant._id.toString());

        const group = await this.groupModel.create({
          users: [sub, participant._id],
        });
        this.groupUserModel.create({
          user: sub,
          group: group._id,
          role: 'admin',
        });
        this.groupUserModel.create({
          user: participant._id,
          group: group._id,
          role: 'member',
        });
        await this.userModel.findByIdAndUpdate(sub, {
          $push: {
            groups: group._id,
          },
        });
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: MessagePayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sub = client.handshake.headers.user['sub'];

    this.server.to(payload.groupId).emit('message', {
      content: payload.message,
      groupId: payload.groupId,
      user: {
        firstName: this.clientsSockets.get(sub).user.firstName,
        lastName: this.clientsSockets.get(sub).user.lastName,
      },
    });
    const message = await this.messageModel.create({
      user: sub,
      content: payload.message,
      group: payload.groupId,
    });
    await this.userModel.findByIdAndUpdate(sub, {
      $push: {
        messages: message._id,
      },
    });
  }
}
