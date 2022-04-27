import {
  ConnectedSocket, MessageBody, OnConnect, OnDisconnect, OnMessage,
  SocketController
} from "socket-controllers";
import {Socket} from "socket.io";
import { Service } from "typedi";

@SocketController()
@Service()
export class MessageController {
  @OnConnect()
  connection(@ConnectedSocket() socket: Socket) {
    // console.log("client connected");
    socket.join('bcc723e1-c8c9-4489-bc58-7172d70190eb'); // TODO: Add a socket endpoint for space joins
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: Socket) {
    // socket.data['test'] = '';
    // console.log("client disconnected");
  }

  @OnMessage("message-send")
  save(@ConnectedSocket() socket: Socket, @MessageBody() message: any) {
    console.log("received message:", message);
    console.log("setting id to the message and sending it back to the client");
    message.id = 1;
  }
}
