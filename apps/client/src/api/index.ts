import axios, {AxiosInstance} from 'axios';
import {Socket, io} from "socket.io-client";

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  authorId: string | null;
  channelId: string;

  author: SimpleUser | null;
}

export interface SimpleUser {
  id: string;
  name: string;
}

export default class MikotoApi {
  axios: AxiosInstance;
  io!: Socket;
  constructor() {
    this.axios = axios.create({
      baseURL: 'http://localhost:9500',
    });
    // this.io = io('http://localhost:9500')
    // this.io.on('connect', () => {
    //   console.log('socket live!');
    // });
  }
}
