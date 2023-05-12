import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
  ConnectedSocket,
  MessageBody,
  OnMessage,
  SocketController,
} from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { env } from '../env';

@SocketController()
@Service()
export class MessageController {
  constructor(private prisma: PrismaClient) {}

  // @OnConnect()
  // connection() {
  // }

  // start subscribing to a new room
  @OnMessage('subscribe')
  subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { space: string },
  ) {
    socket.join(body.space);
  }

  @OnMessage('identify')
  async identify(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { token: string },
  ) {
    socket.data.token = jwt.verify(body.token, env.SECRET);

    if (!socket.data.calibrated) {
      socket.join(`user/${socket.data.token.sub}`);

      const spaces = await this.prisma.spaceUser.findMany({
        where: { userId: socket.data.token.sub },
      });
      spaces.forEach(({ spaceId }) => {
        socket.join(spaceId);
      });
    }
    socket.data.calibrated = true;
  }

  @OnMessage('message-send')
  save(@ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    console.log('received message:', message);
    console.log('setting id to the message and sending it back to the client');
    message.id = 1;
  }
}
