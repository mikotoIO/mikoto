import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import React, { useContext } from 'react';
import { Channel, Message, Space, User } from '../models';
import { MikotoCache } from './cache';
import { MessageEngine } from './engines/MessageEngine';
import { SpaceEngine } from './engines/SpaceEngine';
import { ChannelEngine } from './engines/ChannelEngine';

export class ClientSpace implements Space {
  id: string;
  name: string;
  channels: ChannelEngine;

  constructor(private client: MikotoApi, base: Space) {
    this.id = base.id;
    this.name = base.name;
    this.channels = new ChannelEngine(client, this.id);
  }

  simplify(): Space {
    return {
      id: this.id,
      name: this.name,
    };
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
  spaceCache: MikotoCache<ClientSpace> = new MikotoCache<ClientSpace>();
  channelCache: MikotoCache<ClientChannel> = new MikotoCache<ClientChannel>();

  spaces: SpaceEngine = new SpaceEngine(this);

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

    this.io.on('channelCreate', (data: Channel) => {
      console.log(this.spaceCache);
      const sp = this.spaceCache.get(data.spaceId);
      if (sp) {
        console.log('chantest2');
        sp.channels.emit('create', this.newChannel(data));
      }
    });

    this.io.on('channelDelete', (data: Channel) => {
      const sp = this.spaceCache.get(data.spaceId);
      if (sp) {
        this.channelCache.delete(data.id);
        sp.channels.emit('delete', new ClientChannel(this, data));
      }
    });
  }

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.io.emit('identify', {
      token,
    });
  }

  newChannel(data: Channel): ClientChannel {
    const ch = new ClientChannel(this, data);
    this.channelCache.set(ch);
    return ch;
  }

  newSpace(data: Space): ClientSpace {
    const o = new ClientSpace(this, data);
    this.spaceCache.set(o);
    return o;
  }

  // region Channels
  async getChannel(channelId: string): Promise<ClientChannel> {
    const cached = this.channelCache.get(channelId);
    if (cached) return cached;

    const { data } = await this.axios.get<Channel>(`/channels/${channelId}`);
    return this.newChannel(data);
  }

  async getChannels(spaceId: string): Promise<ClientChannel[]> {
    const { data } = await this.axios.get<Channel[]>(
      `/spaces/${spaceId}/channels`,
    );
    return data.map((x) => this.newChannel(x));
  }

  async createChannel(spaceId: string, name: string): Promise<ClientChannel> {
    const { data } = await this.axios.post<Channel>('/channels', {
      spaceId,
      name,
    });
    return this.newChannel(data);
  }

  async deleteChannel(channelId: string): Promise<ClientChannel> {
    const { data } = await this.axios.delete<Channel>(`/channels/${channelId}`);
    this.channelCache.delete(data.id);
    return new ClientChannel(this, data);
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
  async getSpace(spaceId: string) {
    const cached = this.spaceCache.get(spaceId);
    if (cached) return cached;
    const { data } = await this.axios.get<Space>(`/spaces/${spaceId}`);
    return this.newSpace(data);
  }

  getSpace_CACHED(spaceId: string): ClientSpace {
    const space = this.spaceCache.get(spaceId);
    if (!space) throw new Error('derp');
    return space;
  }

  async getSpaces(): Promise<ClientSpace[]> {
    const { data } = await this.axios.get<Space[]>('/spaces');
    const spaces = data.map((x) => new ClientSpace(this, x));
    spaces.forEach((x) => this.spaceCache.set(x));
    return spaces;
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
