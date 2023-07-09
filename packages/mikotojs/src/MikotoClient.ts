import { ChannelEmitter, MessageEmitter, SpaceEmitter } from './emitters';
import { createClient, MainServiceClient } from './schema';

export class MikotoClient {
  // spaces: SpaceEngine = new SpaceEngine(this);
  client!: MainServiceClient;

  // screw all of the above, we're rewriting the entire thing
  messageEmitter = new MessageEmitter();
  channelEmitter = new ChannelEmitter();
  spaceEmitter = new SpaceEmitter();

  constructor(
    sophonUrl: string,
    accessToken: string,
    onready?: (self: MikotoClient) => void,
  ) {
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
        this.setupClient();
        onready?.(this);
      },
    );
  }

  setupClient() {
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
}
