import axios, { AxiosInstance } from 'axios';
import { Socket, io } from 'socket.io-client';
import { Channel, Message } from '../models';
import React, { useContext } from 'react';
import constants from '../constants';

export default class MikotoApi {
  axios: AxiosInstance;
  io!: Socket;
  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
    });
    this.io = io(url);
    this.io.on('connect', () => {
      console.log('socket live!');
    });
  }

  //region Channels
  async getChannels(): Promise<Channel[]> {
    const { data } = await this.axios.get<Channel[]>(
      `/spaces/${constants.defaultSpace}/channels`,
    );
    return data;
  }

  async createChannel(spaceId: string, name: string): Promise<Channel> {
    const { data } = await this.axios.post<Channel>('/channels', {
      spaceId,
      name,
    });
    return data;
  }

  async deleteChannel(channelId: string): Promise<Channel> {
    const { data } = await this.axios.delete<Channel>(`/channels/${channelId}`);
    return data;
  }
  //endregion

  //region Messages
  async getMessages(channelId: string): Promise<Message[]> {
    const { data } = await this.axios.get<Message[]>(
      `/channels/${channelId}/messages`,
    );
    return data;
  }

  async sendMessage(channelId: string, content: string): Promise<Message> {
    const { data } = await this.axios.post<Message>(
      `/channels/${channelId}/messages`,
      {
        content,
      },
    );
    return data;
  }

  async deleteMessage(channelId: string, messageId: string): Promise<Message> {
    const { data } = await this.axios.delete<Message>(
      `/channels/${channelId}/messages/${messageId}`,
    );
    return data;
  }
  //endregion
}

export const MikotoContext = React.createContext<MikotoApi>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}
