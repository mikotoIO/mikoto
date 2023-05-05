import axios, { AxiosInstance } from 'axios';

import { AuthClient } from './AuthClient';
import { MikotoApi } from './MikotoApi';
import { ICache, InfiniteCache, MikotoCache, ObjectWithID } from './cache';
import { ChannelEmitter, MessageEmitter, SpaceEmitter } from './emitters';
import { ClientMember, ClientRole, ClientSpace } from './entities';
import { Channel, Member, Role, Space, User } from './models';
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
  channelWeakMap = new WeakValueMap<string, Channel>();
  // newChannel = createNewCreator(this, this.channelCache, ClientChannel);

  memberCache = new MikotoCache<ClientMember>();
  newMember = createNewCreator(this, this.memberCache, ClientMember);
  roleCache = new MikotoCache<ClientRole>();
  newRole = createNewCreator(this, this.roleCache, ClientRole);

  // spaces: SpaceEngine = new SpaceEngine(this);
  api: MikotoApi;
  authAPI: AuthClient;
  client!: MainServiceClient;

  // screw all of the above, we're rewriting the entire thing
  messageEmitter = new MessageEmitter();
  channelEmitter = new ChannelEmitter();
  spaceEmitter = new SpaceEmitter();

  constructor(
    authUrl: string,
    sophonUrl: string,
    accessToken: string,
    onready?: (self: MikotoClient) => void,
  ) {
    this.authAPI = new AuthClient(authUrl);

    this.axios = axios.create({
      baseURL: authUrl,
    });
    this.api = new MikotoApi(authUrl);
    this.axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    createClient(
      {
        url: sophonUrl,
        params: {
          accessToken,
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
      this.messageEmitter.emit(`create/${message.channelId}`, message);
    });

    this.client.messages.onDelete(({ messageId, channelId }) => {
      this.messageEmitter.emit(`delete/${channelId}`, messageId);
    });

    this.client.channels.onCreate((channel) => {
      this.channelEmitter.emit(`create/${channel.spaceId}`, channel);
    });

    this.client.channels.onUpdate((channel) => {
      this.channelEmitter.emit(`update/${channel.spaceId}`, channel);
    });

    this.client.channels.onDelete((channel) => {
      this.channelEmitter.emit(`delete/${channel.spaceId}`, channel.id);
    });

    this.client.spaces.onCreate((space) => {
      this.spaceEmitter.emit('create/@', space);
    });

    this.client.spaces.onUpdate((space) => {
      this.spaceEmitter.emit('update/@', space);
    });

    this.client.spaces.onDelete((space) => {
      this.spaceEmitter.emit('delete/@', space.id);
    });
  }

  updateAccessToken(token: string) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.api.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  space = Object.assign((space: Space) => ({}), {});

  channel = Object.assign(
    (channel: Channel) => ({
      sendMessage: async (content: string) => await this.client.messages.send(channel.id, content),

      delete: async () => await this.client.channels.delete(channel.id),
    }),
    {},
  );

  // region Channels
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