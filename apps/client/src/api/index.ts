import axios, { AxiosInstance } from 'axios';
import { Socket, io } from 'socket.io-client';
import React, { useContext } from 'react';
import { Channel, Message, Space, User } from '../models';

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

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.io.emit('identify', {
      token,
    });
  }

  // region Channels
  async getChannels(spaceId: string): Promise<Channel[]> {
    const { data } = await this.axios.get<Channel[]>(
      `/spaces/${spaceId}/channels`,
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
  // endregion

  // region Messages
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
  // endregion

  // region Users
  async getCurrentUser(): Promise<User> {
    const { data } = await this.axios.get<User>('/users/me');
    return data;
  }
  // endregion

  // region Spaces
  async getSpaces(): Promise<Space[]> {
    const { data } = await this.axios.get<Space[]>('/spaces');
    return data;
  }

  async createSpace(name: string): Promise<void> {
    await this.axios.post<Space>('/spaces', {
      name,
    });
  }

  async deleteSpace(id: string): Promise<void> {
    await this.axios.delete<Space>(`/spaces/${id}`);
  }
  // endregion
}

export const MikotoContext = React.createContext<MikotoApi>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}
