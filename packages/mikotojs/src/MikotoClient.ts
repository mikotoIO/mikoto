import { SocketIOClientTransport } from '@hyperschema/client';
import { runInAction } from 'mobx';

import { ChannelEmitter, MessageEmitter, SpaceEmitter } from './emitters';
import { MainService } from './hs-client';
import {
  ChannelStore,
  ClientChannel,
  ClientMember,
  ClientRole,
  ClientSpace,
  ClientUser,
  MemberStore,
  RoleStore,
  SpaceStore,
} from './store';

interface MikotoClientOptions {
  onReady?: (client: MikotoClient) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class MikotoClient {
  // spaces: SpaceEngine = new SpaceEngine(this);
  client!: MainService;

  // screw all of the above, we're rewriting the entire thing
  messageEmitter = new MessageEmitter();
  channelEmitter = new ChannelEmitter();
  spaceEmitter = new SpaceEmitter();

  spaces = new SpaceStore(this, ClientSpace);
  channels = new ChannelStore(this, ClientChannel);
  members = new MemberStore(this, ClientMember);
  roles = new RoleStore(this, ClientRole);
  me!: ClientUser;

  constructor(
    hyperRPCUrl: string,
    accessToken: string,
    { onReady, onConnect, onDisconnect }: MikotoClientOptions,
  ) {
    this.client = new MainService(
      new SocketIOClientTransport({
        url: hyperRPCUrl,
        authToken: accessToken,
      }),
    );
    this.setupClient();

    this.client.onReady(() => {
      onReady?.(this);
    });

    this.client.onConnect(() => {
      onConnect?.();
    });

    this.client.onDisconnect(() => {
      onDisconnect?.();
    });
  }

  setupClient() {
    this.spaces.subscribe(this.client.spaces);
    this.channels.subscribe(this.client.channels);
    this.members.subscribe(this.client.members);
    this.roles.subscribe(this.client.roles);

    this.client.messages.onCreate((message) => {
      this.messageEmitter.emit(`create/${message.channelId}`, message);
    });

    this.client.messages.onUpdate((message) => {
      this.messageEmitter.emit(`update/${message.channelId}`, message);
    });

    this.client.messages.onDelete(({ id, channelId }) => {
      this.messageEmitter.emit(`delete/${channelId}`, id);
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

    this.client.users.onUpdate((user) => {
      if (this.me && user.id === this.me.id) {
        runInAction(() => {
          Object.assign(this.me, user);
        });
      }
    });
  }

  async getMe() {
    if (this.me) return this.me;
    this.me = new ClientUser(this, await this.client.users.me({}));
    return this.me;
  }
}
