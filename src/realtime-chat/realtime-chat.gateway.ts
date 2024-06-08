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
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtAuthGuard } from 'src/auth/ws-jwt.guard';
import { Group, Message, User } from 'src/schema/schema';
import { MessagePayloadDto } from './dtos/message-payload-dto';
import { log } from 'console';
import { JoinWithParticipantPayloadDto } from './dtos/join-group-with-participant-payload.dto';
import { JoinGroupPayloadDto } from './dtos/join-group.dto';

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
    log(this.socketIdToUserIdMap);
    log(this.userIdToSocketInfoMap);
    // const token = client.handshake.query.token;
    // log(token);
    // if (!token) {
    //   client.disconnect();
    //   return;
    // }
    // const decoded = await this.authService.verifyJWT(
    //   token,
    //   this.configService.get('JWT_SECRET'),
    // );
    // if (decoded) {
    //   const { sub } = decoded;
    //   const user = await this.userModel.findById(sub);
    //   if (user) {
    //     this.userIdToSocketInfoMap.set(sub, { socketId: client.id, user });
    //   } else {
    //     console.error('User not found:', sub);
    //     client.disconnect();
    //   }
    // }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = this.socketIdToUserIdMap.get(client.id);
    if (userId) {
      this.userIdToSocketInfoMap.delete(userId);
      this.socketIdToUserIdMap.delete(client.id);
      console.log(`User ${userId} disconnected`);
    }
    log(this.socketIdToUserIdMap);
    log(this.userIdToSocketInfoMap);
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

    const existingGroupWithParticipant = await this.groupModel.findOne({
      $and: [
        { users: { $in: user['sub'] } },
        { users: { $in: [participant._id] } },
      ],
    });
    if (
      existingGroupWithParticipant &&
      (this.server.sockets as any).has(
        this.userIdToSocketInfoMap.get(user['sub'])?.socketId,
      )
    ) {
      const groupId = existingGroupWithParticipant._id;
      if (participant) {
        const participantClient = (this.server.sockets as any).get(
          this.userIdToSocketInfoMap.get(participant._id.toString()).socketId,
        );
        client.join(groupId.toString());
        participantClient.join(groupId.toString());
        console.log(groupId.toString());
      } else {
        console.error('Participant client are not registered');
      }
    } else {
      if (participant) {
        const participantClient = (this.server.sockets as any).get(
          this.userIdToSocketInfoMap.get(participant._id.toString()).socketId,
        ) as Socket;

        if (participantClient) {
          client.join(participant._id.toString());
          participantClient.join(participant._id.toString());
        } else {
          client.emit('error', 'Your buddy is not online');
          console.error('Participant client is not online');
        }

        const group = await this.groupModel.create({
          users: [user['sub'], participant._id],
          admin: user['sub'],
        });
        console.log(group._id.toString());
        await this.userModel.findByIdAndUpdate(user['sub'], {
          $push: {
            groups: group._id,
          },
        });
      }
    }
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
