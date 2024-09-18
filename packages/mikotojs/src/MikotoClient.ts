import { pluginToken } from '@zodios/plugins';
import WebSocket from 'isomorphic-ws';

import { AuthClient } from './AuthClient';
import { api, createApiClient } from './api.gen';
import { ChannelEmitter, MessageEmitter, SpaceEmitter } from './emitters';
import {
  ChannelStore,
  ClientChannel,
  ClientMember,
  ClientRelation,
  ClientRole,
  ClientSpace,
  ClientUser,
  MemberStore,
  RelationStore,
  RoleStore,
  SpaceStore,
} from './store';

interface MikotoClientOptions {
  onReady?: (client: MikotoClient) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// FIXME: this should not be in library-level code
export async function refreshAuth(client: AuthClient) {
  const { refreshToken, accessToken } = await client.refresh(
    localStorage.getItem('REFRESH_TOKEN')!,
  );
  if (refreshToken) {
    localStorage.setItem('REFRESH_TOKEN', refreshToken);
  }
  return accessToken;
}

export class MikotoClient {
  auth: AuthClient;
  api: typeof api;
  ws?: WebSocket;
  private token?: string;
  private timeOfLastRefresh = new Date(0);

  // screw all of the above, we're rewriting the entire thing
  messageEmitter = new MessageEmitter();
  channelEmitter = new ChannelEmitter();
  spaceEmitter = new SpaceEmitter();

  spaces = new SpaceStore(this, ClientSpace);
  channels = new ChannelStore(this, ClientChannel);
  members = new MemberStore(this, ClientMember);
  roles = new RoleStore(this, ClientRole);
  relations = new RelationStore(this, ClientRelation);
  me!: ClientUser;

  constructor(
    hyperRPCUrl: string,
    { onReady, onConnect, onDisconnect }: MikotoClientOptions,
  ) {
    this.auth = new AuthClient('http://localhost:9503');
    this.api = createApiClient('http://localhost:9503', {});
    this.api.use(
      pluginToken({
        getToken: async () => {
          // check if it has been more than 15 minutes since the last refresh
          const now = new Date();
          if (
            now.getTime() - this.timeOfLastRefresh.getTime() >
            15 * 60 * 1000
          ) {
            this.token = await refreshAuth(this.auth);
            this.timeOfLastRefresh = now;
          }
          return this.token;
        },
      }),
    );

    // this.transport = new SocketIOClientTransport({
    //   url: hyperRPCUrl,
    //   authToken: accessToken,
    // });

    // this.client = new MainService(this.transport);
    // this.setupClient();

    // this.client.onReady(() => {
    //   onReady?.(this);
    // });

    // this.client.onConnect(() => {
    //   onConnect?.();
    // });

    // this.client.onDisconnect(() => {
    //   onDisconnect?.();
    // });
  }

  async connect() {
    const token = await refreshAuth(this.auth);
    this.ws = new WebSocket(`ws://localhost:9503/ws?token=${token}`);
    this.ws.onopen = () => {};
    this.ws.onmessage = (event) => {
      const data = JSON.parse((event as any).data);
      console.log(data);
    };
    this.ws.onclose = () => {
      this.ws = undefined;
    };
  }

  setupClient() {
    // this.spaces.subscribe(this.client.spaces);
    // this.channels.subscribe(this.client.channels);
    // this.members.subscribe(this.client.members);
    // this.roles.subscribe(this.client.roles);
    // this.client.messages.onCreate((message) => {
    //   this.messageEmitter.emit(`create/${message.channelId}`, message);
    // });
    // this.client.messages.onUpdate((message) => {
    //   this.messageEmitter.emit(`update/${message.channelId}`, message);
    // });
    // this.client.messages.onDelete(({ id, channelId }) => {
    //   this.messageEmitter.emit(`delete/${channelId}`, id);
    // });
    // this.client.channels.onCreate((channel) => {
    //   this.channelEmitter.emit(`create/${channel.spaceId}`, channel);
    // });
    // this.client.channels.onUpdate((channel) => {
    //   this.channelEmitter.emit(`update/${channel.spaceId}`, channel);
    // });
    // this.client.channels.onDelete((channel) => {
    //   this.channelEmitter.emit(`delete/${channel.spaceId}`, channel.id);
    // });
    // this.client.spaces.onCreate((space) => {
    //   this.spaceEmitter.emit('create/@', space);
    // });
    // this.client.spaces.onUpdate((space) => {
    //   this.spaceEmitter.emit('update/@', space);
    // });
    // this.client.spaces.onDelete((space) => {
    //   this.spaceEmitter.emit('delete/@', space.id);
    // });
    // this.client.users.onUpdate((user) => {
    //   if (this.me && user.id === this.me.id) {
    //     runInAction(() => {
    //       Object.assign(this.me, user);
    //     });
    //   }
    // });
  }

  disconnect() {
    if (this.ws) {
      this.ws.onmessage = null;
      this.ws.close();
    }
    // this.transport.disconnect();
    this.spaceEmitter.removeAllListeners();
    this.channelEmitter.removeAllListeners();
    this.messageEmitter.removeAllListeners();
  }

  async getMe() {
    if (this.me) return this.me;

    let op = await this.api['user.get']();
    this.me = new ClientUser(this, await this.api['user.get']());
    return this.me;
  }
}
