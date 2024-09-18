import { pluginToken } from '@zodios/plugins';
import { EventEmitter } from 'events';
import WebSocket from 'isomorphic-ws';
import TypedEventEmitter from 'typed-emitter';

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
import { WsEvents } from './websocket';

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
  emitter = new EventEmitter() as TypedEventEmitter<WsEvents>;
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
  }

  async connect() {
    const token = await refreshAuth(this.auth);
    this.setupClient();
    this.ws = new WebSocket(`ws://localhost:9503/ws?token=${token}`);
    this.ws.onopen = () => {};
    this.ws.onmessage = (event) => {
      const msg = JSON.parse((event as any).data);
      this.emitter.emit(msg.op, msg.data);
    };
    this.ws.onclose = () => {
      this.ws = undefined;
    };
  }

  setupClient() {
    this.spaces.subscribe({
      onCreate: (fn) => {
        this.emitter.on('spaces.onCreate', fn);
      },
      onUpdate: (fn) => {
        this.emitter.on('spaces.onUpdate', fn);
      },
      onDelete: (fn) => {
        this.emitter.on('spaces.onDelete', fn);
      },
    });

    this.channels.subscribe({
      onCreate: (fn) => {
        this.emitter.on('channels.onCreate', fn);
      },
      onUpdate: (fn) => {
        this.emitter.on('channels.onUpdate', fn);
      },
      onDelete: (fn) => {
        this.emitter.on('channels.onDelete', fn);
      },
    });

    this.members.subscribe({
      onCreate: (fn) => {
        this.emitter.on('members.onCreate', fn);
      },
      onUpdate: (fn) => {
        this.emitter.on('members.onUpdate', fn);
      },
      onDelete: (fn) => {
        this.emitter.on('members.onDelete', fn);
      },
    });

    this.roles.subscribe({
      onCreate: (fn) => {
        this.emitter.on('roles.onCreate', fn);
      },
      onUpdate: (fn) => {
        this.emitter.on('roles.onUpdate', fn);
      },
      onDelete: (fn) => {
        this.emitter.on('roles.onDelete', fn);
      },
    });

    this.emitter.on('messages.onCreate', (message) => {
      this.messageEmitter.emit(`create/${message.channelId}`, message);
    });
    this.emitter.on('messages.onUpdate', (message) => {
      this.messageEmitter.emit(`update/${message.channelId}`, message);
    });
    this.emitter.on('messages.onDelete', ({ messageId, channelId }) => {
      this.messageEmitter.emit(`delete/${channelId}`, messageId);
    });
    this.emitter.on('channels.onCreate', (channel) => {
      this.channelEmitter.emit(`create/${channel.spaceId}`, channel);
    });
    this.emitter.on('channels.onUpdate', (channel) => {
      this.channelEmitter.emit(`update/${channel.spaceId}`, channel);
    });
    this.emitter.on('channels.onDelete', (channel) => {
      this.channelEmitter.emit(`delete/${channel.spaceId}`, channel.id);
    });
    this.emitter.on('spaces.onCreate', (space) => {
      this.spaceEmitter.emit('create/@', space);
    });
    this.emitter.on('spaces.onUpdate', (space) => {
      this.spaceEmitter.emit('update/@', space);
    });
    this.emitter.on('spaces.onDelete', (space) => {
      this.spaceEmitter.emit('delete/@', space.id);
    });
    this.emitter.on('users.onUpdate', (user) => {
      if (this.me && user.id === this.me.id) {
        Object.assign(this.me, user);
      }
    });
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

    this.emitter.removeAllListeners();
  }

  async getMe() {
    if (this.me) return this.me;

    let op = await this.api['user.get']();
    this.me = new ClientUser(this, await this.api['user.get']());
    return this.me;
  }
}
