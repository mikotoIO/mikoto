import { pluginToken } from '@zodios/plugins';

import { AuthClient } from './AuthClient';
import { WebsocketApi } from './WebsocketApi';
import { type Api, createApiClient } from './api.gen';
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
  public ws: WebsocketApi;

  spaces = new SpaceManager(this);
  channels = new ChannelManager(this);

  private timeOfLastRefresh = new Date(0);
  private token?: string;

  constructor(options: MikotoClientOptions) {
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

    const websocketUrl = new URL(options.url);
    websocketUrl.protocol = websocketUrl.protocol.replace('http', 'ws');
    this.ws = new WebsocketApi({
      url: `${websocketUrl.origin}/ws`,
    });
  }
}
