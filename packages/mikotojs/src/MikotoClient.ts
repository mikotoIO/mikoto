import axios, { AxiosInstance } from 'axios';

import { AuthClient } from './AuthClient';
import { MikotoApi } from './MikotoApi';
import { ICache, InfiniteCache, MikotoCache, ObjectWithID } from './cache';
import { SpaceEngine } from './engines';
import {
  ClientChannel,
  ClientMember,
  ClientMessage,
  ClientRole,
  ClientSpace,
} from './entities';
import { Channel, Member, Role, User } from './models';
import { createClient, MainServiceClient } from './schema';
import { patch } from './util';
import WeakValueMap from './util/WeakValueMap';

function createNewCreator<D extends ObjectWithID, C extends ObjectWithID>(
  client: MikotoClient,
  cache: ICache<C>,
  Construct: new (api: MikotoClient, data: D) => C,
) {
  return (data: D, forceRefresh: boolean = false): C => {
    const space = cache.get(data.id);
    if (forceRefresh || space === undefined)
      return cache.set(new Construct(client, data));

    patch(space, data as any);
    return space;
  };
}

export class MikotoClient {
  axios: AxiosInstance;

  // cache everything
  spaceCache = new InfiniteCache<ClientSpace>();
  newSpace = createNewCreator(this, this.spaceCache, ClientSpace);
  channelWeakMap = new WeakValueMap<string, ClientChannel>();
  // newChannel = createNewCreator(this, this.channelCache, ClientChannel);

  memberCache = new MikotoCache<ClientMember>();
  newMember = createNewCreator(this, this.memberCache, ClientMember);
  roleCache = new MikotoCache<ClientRole>();
  newRole = createNewCreator(this, this.roleCache, ClientRole);

  spaces: SpaceEngine = new SpaceEngine(this);
  api: MikotoApi;
  authAPI: AuthClient;
  client!: MainServiceClient;

  constructor(
    url: string,
    accessToken: string,
    onready?: (self: MikotoClient) => void,
  ) {
    this.authAPI = new AuthClient(url);

    this.axios = axios.create({
      baseURL: url,
    });
    this.api = new MikotoApi(url);

    createClient(
      {
        url: 'http://localhost:3510',
        params: {
          accessToken: accessToken,
        },
      },
      (client) => {
        console.log(client);
        this.client = client;
        this.setupClient(client);
        onready?.(this);
      },
    );
  }

  setupClient(client: MainServiceClient) {
    // rewrite io to use sophon
    this.client.messages.onCreate((message) => {
      const ch = this.channelWeakMap.get(message.channelId);
      if (ch) {
        ch.messages.emit('create', new ClientMessage(this, message, ch));
        ch.instance.emit('update', {
          ...ch.simplify(),
          lastUpdated: new Date().toJSON(),
        });
      }
    });

    this.client.messages.onDelete(({ messageId, channelId }) => {
      const ch = this.channelWeakMap.get(channelId);
      if (ch) {
        ch.messages.emit('delete', messageId);
      }
    });

    this.client.channels.onCreate((channel) => {
      const sp = this.spaceCache.get(channel.spaceId);
      if (sp) {
        sp.channels.emit('create', new ClientChannel(this, channel, sp));
      }
    });

    this.client.channels.onDelete((id) => {
      const sp = this.spaceCache.get(id);
      if (sp) {
        sp.channels.emit('delete', id);
      }
    });

    this.client.spaces.onCreate((space) => {
      this.spaces.emit('create', this.newSpace(space));
    });

    this.client.spaces.onDelete((id) => {
      this.spaceCache.delete(id);
      this.spaces.emit('delete', id);
    });
  }

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.api.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  // region Channels
  async getChannel(channelId: string): Promise<ClientChannel> {
    const { data } = await this.axios.get<Channel>(`/channels/${channelId}`);
    return this.spaceCache
      .get(data.spaceId)!
      .channels.cache.set(
        new ClientChannel(this, data, this.spaceCache.get(data.spaceId)!),
      );
  }

  async moveChannel(channelId: string, order: number): Promise<void> {
    await this.axios.post(`/channels/${channelId}/move`, { order });
  }

  async ack(channelId: string): Promise<void> {
    // await this.axios.post(`/channels/${channelId}/ack`);
  }

  async unreads(spaceId: string): Promise<Record<string, string>> {
    // const { data } = await this.axios.get(`/spaces/${spaceId}/unreads`);
    return {};
  }
  // endregion

  // region Messages
  async deleteMessage(channelId: string, messageId: string) {
    await this.client.messages.delete(channelId, messageId);
  }
  // endregion

  // region Users
  async getCurrentUser(): Promise<User> {
    return await this.client.users.me();
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
    return this.newSpace((await this.client.spaces.get(spaceId))!);
  }

  async getSpaces(): Promise<ClientSpace[]> {
    return (await this.client.spaces.list()).map((x) => this.newSpace(x, true));
  }

  async joinSpace(id: string): Promise<void> {
    await this.client.spaces.join(id);
  }

  async leaveSpace(id: string): Promise<void> {
    await this.client.spaces.leave(id);
  }

  async createSpace(name: string): Promise<void> {
    await this.client.spaces.create(name);
  }

  async deleteSpace(id: string): Promise<void> {
    await this.client.spaces.delete(id);
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
      color?: string;
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
    return await this.client.voice.join(channelId);
  }
}
