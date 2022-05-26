import axios, { AxiosInstance } from 'axios';
import { Socket, io } from 'socket.io-client';
import React, { useContext } from 'react';
import { Channel, Message, Space, User } from '../models';
import { DeltaEngine } from './deltaEngine';

export class MessageEngine implements DeltaEngine<Message> {
  constructor(private client: MikotoApi, private channelId: string) {}

  async fetch(): Promise<Message[]> {
    return this.client.getMessages(this.channelId);
  }

  offCreate(fn: (item: Message) => void): void {
    this.client.io.off('messageCreate', fn);
  }

  offDelete(fn: (item: Message) => void): void {
    this.client.io.off('messageDelete', fn);
  }

  onCreate(fn: (item: Message) => void): (item: Message) => void {
    const fnx = (item: Message) => {
      if (item.channelId !== this.channelId) return;
      fn(item);
    };
    this.client.io.on('messageCreate', fnx);
    return fnx;
  }

  onDelete(fn: (item: Message) => void): (item: Message) => void {
    const fnx = (item: Message) => {
      if (item.channelId !== this.channelId) return;
      fn(item);
    };
    this.client.io.on('messageDelete', fnx);
    return fnx;
  }
}

export class ClientChannel implements Channel {
  id: string;
  name: string;
  spaceId: string;
  messages: MessageEngine;

  constructor(private client: MikotoApi, base: Channel) {
    this.id = base.id;
    this.name = base.name;
    this.spaceId = base.spaceId;
    this.messages = new MessageEngine(client, this.id);
  }
}

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
