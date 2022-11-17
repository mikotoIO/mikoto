import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import React, { useContext } from 'react';
import {
  Channel,
  Member,
  Message,
  Role,
  Space,
  User,
  VoiceResponse,
} from '../models';
import { MikotoCache, ObjectWithID } from './cache';
import { SpaceEngine } from './engines/SpaceEngine';
import { ClientSpace } from './entities/ClientSpace';
import { ClientChannel } from './entities/ClientChannel';
import { patch } from './util';
import { ClientMember } from './entities/ClientMember';
import { ClientRole } from './entities/ClientRole';

function createNewCreator<D extends ObjectWithID, C extends D>(
  api: MikotoApi,
  cache: MikotoCache<C>,
  Construct: new (api: MikotoApi, data: D) => C,
) {
  return (data: D, forceRefresh: boolean = false) => {
    const space = cache.get(data.id);
    if (forceRefresh || space === undefined)
      return cache.set(new Construct(api, data));

    patch(space, data as any);
    return space;
  };
}

export default class MikotoApi {
  axios: AxiosInstance;
  io!: Socket;

  // cache everything
  spaceCache = new MikotoCache<ClientSpace>();
  newSpace = createNewCreator(this, this.spaceCache, ClientSpace);
  channelCache = new MikotoCache<ClientChannel>();
  newChannel = createNewCreator(this, this.channelCache, ClientChannel);
  memberCache = new MikotoCache<ClientMember>();
  newMember = createNewCreator(this, this.memberCache, ClientMember);
  roleCache = new MikotoCache<ClientRole>();
  newRole = createNewCreator(this, this.roleCache, ClientRole);

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
        ch.instance.emit('update', {
          ...ch.simplify(),
          lastUpdated: new Date().toJSON(),
        });
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
    return data.map((x) => this.newChannel(x, true));
  }

  async createChannel(
    spaceId: string,
    options: {
      name: string;
      type: string;
    },
  ): Promise<ClientChannel> {
    const { data } = await this.axios.post<Channel>('/channels', {
      spaceId,
      name: options.name,
      type: options.type,
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

  async getMembers(spaceId: string): Promise<ClientMember[]> {
    const { data } = await this.axios.get<Member[]>(
      `/spaces/${spaceId}/members`,
    );
    return data.map((x) => this.newMember(x));
  }

  // endregion

  // region Spaces
  async getSpace(spaceId: string) {
    const cached = this.spaceCache.get(spaceId);
    if (cached) return cached;
    const { data } = await this.axios.get<Space>(`/spaces/${spaceId}`);
    return this.newSpace(data);
  }

  async getSpaces(): Promise<ClientSpace[]> {
    const { data } = await this.axios.get<Space[]>('/spaces');
    return data.map((x) => this.newSpace(x, true));
  }

  async joinSpace(id: string): Promise<void> {
    await this.axios.post<Space>(`/join/${id}`);
  }

  async leaveSpace(id: string): Promise<void> {
    await this.axios.post<Space>(`/leave/${id}`);
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

  // region Roles

  async getRoles(spaceId: string): Promise<ClientRole[]> {
    const { data } = await this.axios.get<Role[]>(`/spaces/${spaceId}/roles`);
    return data.map((x) => this.newRole(x, true));
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

  async getVoice(channelId: string) {
    const { data } = await this.axios.get<VoiceResponse>(`/voice/${channelId}`);
    return data;
  }
}

export const MikotoContext = React.createContext<MikotoApi>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}
