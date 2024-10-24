import { debounce } from 'lodash-es';

import {
  Api,
  ChangePasswordPayload,
  CreateBotPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordConfirmData,
  ResetPasswordPayload,
  createApiClient,
} from './api.gen';

export interface AuthClientOptions {
  url: string;
  refreshToken?: () => string;
  setRefreshToken?: (token: string) => void;
}

export class AuthClient {
  api: Api;
  refreshToken?: string;

  // this prevents multiple refresh calls from happening at the same time
  // when multiple requests are made in the same tick
  debouncedRefresh = debounce(
    async () => {
      const res = await this.api['account.refresh']({
        refreshToken: this.refreshToken ?? '',
      });
      if (res.refreshToken) {
        this.refreshToken = res.refreshToken;
      }
      return res.accessToken;
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  );

  constructor(options: AuthClientOptions) {
    this.api = createApiClient(options.url, {});
    this.refreshToken = options.refreshToken?.();
  }

  async refresh(): Promise<string> {
    return this.debouncedRefresh();
  }

  async register(payload: RegisterPayload) {
    const res = await this.api['account.register'](payload);
    return res;
  }

  async login(payload: LoginPayload) {
    const res = await this.api['account.login'](payload);
    return res;
  }

  async changePassword(payload: ChangePasswordPayload) {
    const res = await this.api['account.change_password'](payload);
    return res;
  }

  async resetPassword(payload: ResetPasswordPayload) {
    const res = await this.api['account.reset_password'](payload);
    return res;
  }

  async resetPasswordSubmit(payload: ResetPasswordConfirmData) {
    const res = await this.api['account.reset_password.confirm'](payload);
    return res;
  }

  // bot-related
  async createBot(payload: CreateBotPayload) {
    const res = await this.api['bots.create'](payload);
    return res;
  }

  async listBots() {
    const res = await this.api['bots.list']();
    return res;
  }
}
