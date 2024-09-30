import { Api, createApiClient } from './api.gen';

export interface AuthClientOptions {
  url: string;
  refreshToken?: () => string;
  setRefreshToken?: (token: string) => void;
}

export class AuthClient {
  api: Api;
  refreshToken?: string;

  constructor(options: AuthClientOptions) {
    this.api = createApiClient(options.url, {});
    this.refreshToken = options.refreshToken?.();
  }

  async refresh(): Promise<string> {
    const res = await this.api['account.refresh']({
      refreshToken: this.refreshToken ?? '',
    });
    if (res.refreshToken) {
      this.refreshToken = res.refreshToken;
    }
    return res.accessToken;
  }
}
