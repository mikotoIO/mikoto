import { pluginToken } from '@zodios/plugins';

import { AuthClient } from './AuthClient';
import { WebsocketApi } from './WebsocketApi';
import { type Api, createApiClient } from './api.gen';
import { RelationshipManager, UserManager } from './managers';
import { ChannelManager } from './managers/channel';
import { SpaceManager } from './managers/space';

export interface MikotoClientOptions {
  auth: AuthClient;
  url: string;
  refreshToken?: string;
}

export class MikotoClient {
  public auth: AuthClient;
  public rest: Api;
  public ws!: WebsocketApi;

  private timeOfLastRefresh = new Date(0);
  private token?: string;

  spaces = new SpaceManager(this);
  channels = new ChannelManager(this);
  user = new UserManager(this);
  relationships = new RelationshipManager(this);

  constructor(private options: MikotoClientOptions) {
    this.auth = options.auth;
    this.rest = createApiClient(options.url, {});

    this.rest.use(
      pluginToken({
        getToken: async () => {
          // check if it has been more than 15 minutes since the last refresh
          const now = new Date();
          if (
            now.getTime() - this.timeOfLastRefresh.getTime() >
            15 * 60 * 1000
          ) {
            this.token = await this.auth.refresh();
            this.timeOfLastRefresh = now;
          }
          return this.token;
        },
      }),
    );

    this.connect();
  }

  async connect() {
    this.token = await this.auth.refresh();
    const websocketUrl = new URL(this.options.url);
    websocketUrl.protocol = websocketUrl.protocol.replace('http', 'ws');
    this.ws = new WebsocketApi({
      url: `${websocketUrl.origin}/ws?token=${this.token}`,
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.ws.close();
    }
  }
}
