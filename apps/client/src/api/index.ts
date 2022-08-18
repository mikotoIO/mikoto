import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import React, { useContext } from 'react';
import { Channel, Message, Space, User } from '../models';
import { MikotoCache } from './cache';
import { SpaceEngine } from './engines/SpaceEngine';
import { ClientSpace } from './entities/ClientSpace';
import { ClientChannel } from './entities/ClientChannel';
import { patch } from './util';

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
        // ch.instance.emit('update', {
        //   ...ch.simplify(),
        //   lastUpdated: new Date().toDateString(),
        // });
        // ch.space.channels.emit('update', ch);
      }
    });

    this.io.on('messageDelete', (message: Message) => {
      const ch = this.channelCache.get(message.channelId);
      if (ch) {
        ch.messages.emit('delete', message);
      }
    });

    this.io.on('channelCreate', (data: Channel) => {
      const sp = this.spaceCache.get(data.spaceId);
      if (sp) {
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

    this.io.on('spaceCreate', (data: Space) => {
      this.spaces.emit('create', this.newSpace(data));
    });

    this.io.on('spaceDelete', (data: Space) => {
      this.spaceCache.delete(data.id);
      this.spaces.emit('delete', new ClientSpace(this, data));
    });
  }

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.io.emit('identify', {
      token,
    });
  }

  newChannel(data: Channel): ClientChannel {
    const channel = this.channelCache.get(data.id);
    if (channel === undefined)
      return this.channelCache.set(new ClientChannel(this, data));

    patch(channel, data);
    return channel;
  }

  newSpace(data: Space): ClientSpace {
    const space = this.spaceCache.get(data.id);
    if (space === undefined)
      return this.spaceCache.set(new ClientSpace(this, data));

    patch(space, data);
    return space;
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

  async moveChannel(channelId: string, order: number): Promise<void> {
    await this.axios.post(`/channels/${channelId}/move`, { order });
  }

  async ack(channelId: string): Promise<void> {
    await this.axios.post(`/channels/${channelId}/ack`);
  }

  async unreads(spaceId: string): Promise<{ [key: string]: string }> {
    const { data } = await this.axios.get(`/spaces/${spaceId}/unreads`);
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

  async joinSpace(id: string): Promise<void> {
    await this.axios.post<Space>(`/join/${id}`);
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

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    await this.axios.post('/account/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const MikotoContext = React.createContext<MikotoApi>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}
