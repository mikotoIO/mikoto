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
import { ICache, InfiniteCache, MikotoCache, ObjectWithID } from './cache';
import { SpaceEngine } from './engines/SpaceEngine';
import { ClientSpace } from './entities/ClientSpace';
import { ClientChannel } from './entities/ClientChannel';
import { patch } from './util';
import { ClientMember } from './entities/ClientMember';
import { ClientRole } from './entities/ClientRole';
import * as authAPI from './auth';

function createNewCreator<D extends ObjectWithID, C extends ObjectWithID>(
  api: MikotoClient,
  cache: ICache<C>,
  Construct: new (api: MikotoClient, data: D) => C,
) {
  return (data: D, forceRefresh: boolean = false): C => {
    const space = cache.get(data.id);
    if (forceRefresh || space === undefined)
      return cache.set(new Construct(api, data));

    patch(space, data as any);
    return space;
  };
}

export default class MikotoClient {
  axios: AxiosInstance;
  io!: Socket;

  // cache everything
  spaceCache = new InfiniteCache<ClientSpace>();
  newSpace = createNewCreator(this, this.spaceCache, ClientSpace);
  channelCache = new InfiniteCache<ClientChannel>();
  // newChannel = createNewCreator(this, this.channelCache, ClientChannel);

  memberCache = new MikotoCache<ClientMember>();
  newMember = createNewCreator(this, this.memberCache, ClientMember);
  roleCache = new MikotoCache<ClientRole>(Infinity);
  newRole = createNewCreator(this, this.roleCache, ClientRole);

  spaces: SpaceEngine = new SpaceEngine(this);

  constructor(url: string, onready?: (self: MikotoClient) => void) {
    this.axios = axios.create({
      baseURL: url,
    });
    this.io = io(url);
    this.io.on('connect', () => {
      onready?.(this);
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
        sp.channels.emit('create', new ClientChannel(this, data, sp));
      }
    });

    this.io.on('channelDelete', (data: Channel) => {
      const sp = this.spaceCache.get(data.spaceId);
      if (sp) {
        this.channelCache.delete(data.id);
        sp.channels.emit('delete', new ClientChannel(this, data, sp));
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
    return this.spaceCache
      .get(data.spaceId)!
      .channels.cache.set(
        new ClientChannel(this, data, this.spaceCache.get(data.spaceId)!),
      );
  }

  async getChannels(spaceId: string): Promise<ClientChannel[]> {
    const { data } = await this.axios.get<Channel[]>(
      `/spaces/${spaceId}/channels`,
    );
    const channelCache = this.spaceCache.get(spaceId)!.channels.cache;
    return data.map((x) =>
      channelCache.set(
        new ClientChannel(this, x, this.spaceCache.get(spaceId)!),
      ),
    );
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
    return new ClientChannel(this, data, this.spaceCache.get(spaceId)!);
  }

  async deleteChannel(channelId: string): Promise<ClientChannel> {
    const { data } = await this.axios.delete<Channel>(`/channels/${channelId}`);
    this.channelCache.delete(data.id);
    return new ClientChannel(this, data, this.spaceCache.get(data.spaceId)!);
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

  async getMember(spaceId: string, userId: string): Promise<ClientMember> {
    const { data } = await this.axios.get<Member>(
      `/spaces/${spaceId}/members/${userId}`,
    );
    return this.newMember(data);
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

  async createRole(spaceId: string, name: string): Promise<ClientRole> {
    const { data } = await this.axios.post<Role>(`/spaces/${spaceId}/roles`, {
      name,
      position: 0,
      spacePermissions: '0',
    });
    return this.newRole(data);
  }

  async editRole(
    spaceId: string,
    roleId: string,
    options: {
      name?: string;
      spacePermissions?: string;
      position?: number;
    },
  ): Promise<ClientRole> {
    const { data } = await this.axios.patch<Role>(
      `/spaces/${spaceId}/roles/${roleId}`,
      options,
    );
    return this.newRole(data);
  }

  async deleteRole(spaceId: string, roleId: string): Promise<void> {
    await this.axios.delete<Role>(`/spaces/${spaceId}/roles/${roleId}`);
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

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}

function constructMikotoSimple(url: string) {
  return new Promise<MikotoClient>((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const mikotoApi = new MikotoClient(url, (m) => {
        resolve(m);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function refreshAccess(mikoto: MikotoClient) {
  const t = await authAPI.refresh({
    accessToken: '',
    refreshToken: localStorage.getItem('REFRESH_TOKEN')!,
  });
  localStorage.setItem('REFRESH_TOKEN', t.refreshToken);
  mikoto.updateAccessToken(t.accessToken);
}

export async function constructMikoto(url: string) {
  const mikoto = await constructMikotoSimple(url);

  await refreshAccess(mikoto);
  setInterval(() => {
    refreshAccess(mikoto).then(() => {
      console.log('refreshed');
    });
  }, 10 * 60 * 1000);

  await mikoto.getSpaces();
  return mikoto;
}
