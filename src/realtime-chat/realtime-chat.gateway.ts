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
import { Group, Message, User } from 'src/schema/schema';
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
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private userIdToSocketInfoMap = new Map<
    string,
    { socketId: string; user: User }
  >();

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
        this.userIdToSocketInfoMap.set(sub, { socketId: client.id, user });
      } else {
        console.error('User not found:', sub);
        client.disconnect();
      }
    }
  }

  async handleDisconnect(client: Socket) {
    const { authorization } = client.handshake.headers;
    const { sub } = await this.authService.verifyJWTBearerToken(
      authorization,
      this.configService.get('JWT_SECRET'),
    );
    this.userIdToSocketInfoMap.delete(sub);
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
      (this.server.sockets as any).has(
        this.userIdToSocketInfoMap.get(user['sub']).socketId,
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

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() { message, groupId }: MessagePayloadDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sub = client.handshake.headers.user['sub'];

    this.server.to(groupId).emit('message', {
      content: message,
      groupId: groupId,
      user: {
        firstName: this.userIdToSocketInfoMap.get(sub).user.firstName,
        lastName: this.userIdToSocketInfoMap.get(sub).user.lastName,
      },
    });

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
