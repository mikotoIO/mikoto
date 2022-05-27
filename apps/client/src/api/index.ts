import axios, { AxiosInstance } from 'axios';
import { Socket, io } from 'socket.io-client';
import React, { useContext } from 'react';
import { Channel, Message, Space, User } from '../models';
import { DeltaEngine, DeltaEngineX } from './deltaEngine';
import { MikotoCache } from './cache';

export class ChannelEngine implements DeltaEngine<Channel> {
  constructor(private client: MikotoApi, private spaceId: string) {}

  async fetch(): Promise<Channel[]> {
    return this.client.getChannels(this.spaceId);
  }

  offCreate(fn: (item: Channel) => void): void {
    this.client.io.off('channelCreate', fn);
  }

  offDelete(fn: (item: Channel) => void): void {
    this.client.io.off('channelCreate', fn);
  }

  onCreate(fn: (item: Channel) => void): (item: Channel) => void {
    const fnx = (item: Channel) => {
      if (item.spaceId !== this.spaceId) return;
      fn(item);
    };
    this.client.io.on('channelCreate', fnx);
    return fnx;
  }

  onDelete(fn: (item: Channel) => void): (item: Channel) => void {
    const fnx = (item: Channel) => {
      if (item.spaceId !== this.spaceId) return;
      fn(item);
    };
    this.client.io.on('channelDelete', fnx);
    return fnx;
  }
}

export class MessageEngine extends DeltaEngineX<Message> {
  constructor(private client: MikotoApi, private channelId: string) {
    super();
  }

  async fetch(): Promise<Message[]> {
    return this.client.getMessages(this.channelId);
  }
}

export class ClientSpace implements Space {
  id: string;
  name: string;
  channels: ChannelEngine;

  constructor(private client: MikotoApi, base: Space) {
    this.id = base.id;
    this.name = base.name;
    this.channels = new ChannelEngine(client, this.id);
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

  simplify(): Channel {
    return {
      id: this.id,
      name: this.name,
      spaceId: this.spaceId,
    };
  }
}

export default class MikotoApi {
  axios: AxiosInstance;
  io!: Socket;

  // cache everything
  spaceCache: MikotoCache<Space> = new MikotoCache<Space>();
  channelCache: MikotoCache<ClientChannel> = new MikotoCache<ClientChannel>();

  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
    });
    this.io = io(url);
    this.io.on('connect', () => {
      console.log('socket live!');
    });

    this.io.on('messageCreate', (message: Message) => {
      const ch = this.channelCache.get(message.channelId);
      if (ch) {
        ch.messages.emit('create', message);
      }
    });

    this.io.on('messageDelete', (message: Message) => {
      const ch = this.channelCache.get(message.channelId);
      if (ch) {
        ch.messages.emit('delete', message);
      }
    });
  }

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.io.emit('identify', {
      token,
    });
  }

  // region Channels

  // TODO: this is to be removed at a later point, use suspense
  getChannel_CACHED(channelId: string): ClientChannel {
    const channel = this.channelCache.get(channelId);
    if (!channel) throw new Error('derp');
    return channel;
  }

  async getChannels(spaceId: string): Promise<ClientChannel[]> {
    const { data } = await this.axios.get<Channel[]>(
      `/spaces/${spaceId}/channels`,
    );
    const channels = data.map((x) => new ClientChannel(this, x));
    channels.forEach((x) => this.channelCache.set(x));
    return channels;
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
