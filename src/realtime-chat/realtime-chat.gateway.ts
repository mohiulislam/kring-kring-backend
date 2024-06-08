import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtAuthGuard } from 'src/auth/ws-jwt.guard';
import { Group, Message, User } from 'src/schema/schema';
import { JoinGroupPayloadDto } from './dtos/join-group.dto';
import { JoinWithParticipantPayloadDto } from './dtos/join-with-participant-payload.dto';
import { MessagePayloadDto } from './dtos/message-payload-dto';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ namespace: 'realtime-chat', cors: true })
@UsePipes(new ValidationPipe())
export class RealtimeChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(
    @InjectModel(Group.name) private groupModel: Model<Group>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private userIdToSocketInfoMap = new Map<
    string,
    { socketId: string; user: User }
  >();

  private socketIdToUserIdMap = new Map<string, string>();

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      const token = socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }
      const decoded = await this.authService.verifyJWT(
        token,
        this.configService.get('JWT_SECRET'),
      );
      if (decoded) {
        const user = await this.userModel.findById(decoded.sub);
        this.userIdToSocketInfoMap.set(decoded.sub, {
          socketId: socket.id,
          user: user,
        });
        this.socketIdToUserIdMap.set(socket.id, decoded.sub);
        next();
      } else {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.socketIdToUserIdMap.get(client.id);
    if (userId) {
      this.userIdToSocketInfoMap.delete(userId);
      this.socketIdToUserIdMap.delete(client.id);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @MessageBody() { groupId }: JoinGroupPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.handshake.headers.user;
    const group = await this.groupModel.findById(groupId);
    if (group) {
      if (group.users.includes(user['sub'])) {
        client.join(groupId.toString());
      }
    }
  }

  @SubscribeMessage('joinWithParticipant')
  async handleJoinGroupWithParticipant(
    @MessageBody() { participantUserName }: JoinWithParticipantPayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.handshake.headers.user;
    if (user['username'] === participantUserName) {
      return;
    }

    const participant = await this.userModel.findOne({
      username: participantUserName,
    });

    if (!participant) {
      throw new WsException('Participant not found');
    }

    const existingGroupWithParticipant = await this.groupModel.findOne({
      $and: [
        { users: { $in: user['sub'] } },
        { users: { $in: [participant._id] } },
      ],
    });

    if (existingGroupWithParticipant) {
      throw new WsException('participant already in group');
    }
    const group = await this.groupModel.create({
      users: [user['sub'], participant._id],
      admin: user['sub'],
    });
    const participantClient = (this.server.sockets as any).get(
      this.userIdToSocketInfoMap.get(participant._id.toString()).socketId,
    );
    client.join(group._id.toString());
    participantClient.join(group._id.toString());
    console.log(group._id.toString());
    await this.userModel.findByIdAndUpdate(user['sub'], {
      $push: {
        groups: group._id,
      },
    });
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() { message, groupId }: MessagePayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.handshake.headers.user;
    this.server.to(groupId).emit('message', {
      content: message,
      group: groupId,
      createdAt: new Date(),
      user: {
        userId: user['sub'],
        firstName: this.userIdToSocketInfoMap.get(user['sub']).user.firstName,
        lastName: this.userIdToSocketInfoMap.get(user['sub']).user.lastName,
      },
    });
    const savedMessage = await this.messageModel.create({
      user: user['sub'],
      content: message,
      group: groupId,
    });
    await this.userModel.findByIdAndUpdate(user['sub'], {
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
