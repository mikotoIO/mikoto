import {
  ConnectedSocket,
  MessageBody,
  OnConnect,
  OnMessage,
  SocketController,
} from 'socket-controllers';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import constants from '../constants';

@SocketController()
@Service()
export class MessageController {
  @OnConnect()
  connection(@ConnectedSocket() socket: Socket) {
    // console.log("client connected");
    socket.join(constants.defaultSpace); // TODO: Add a socket endpoint for space joins
  }

  @OnMessage('message-send')
  save(@ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    console.log('received message:', message);
    console.log('setting id to the message and sending it back to the client');
    message.id = 1;
  }
}
