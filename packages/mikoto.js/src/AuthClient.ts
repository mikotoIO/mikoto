import { pluginToken } from '@zodios/plugins';
import { debounce } from 'lodash-es';

import {
  Api,
  BotLoginPayload,
  ChangePasswordPayload,
  CreateBotPayload,
  InstallBotPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordConfirmData,
  ResetPasswordPayload,
  UpdateBotPayload,
  createApiClient,
} from './api.gen';

export interface AuthClientOptions {
  url: string;
  refreshToken?: () => string;
  setRefreshToken?: (token: string) => void;
}

export interface BotAuthClientOptions {
  url: string;
  botId: string;
  token: string;
}

export class AuthClient {
  api: Api;
  refreshToken?: string;
  private setRefreshToken?: (token: string) => void;

  // this prevents multiple refresh calls from happening at the same time
  // when multiple requests are made in the same tick
  debouncedRefresh = debounce(
    async () => {
      const res = await this.api['account.refresh']({
        refreshToken: this.refreshToken ?? '',
      });
      if (res.refreshToken) {
        this.refreshToken = res.refreshToken;
        this.setRefreshToken?.(res.refreshToken);
      }
      return res.accessToken;
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  );

  protected accessToken?: string;

  constructor(options: AuthClientOptions) {
    this.api = createApiClient(options.url, {});
    this.refreshToken = options.refreshToken?.();
    this.setRefreshToken = options.setRefreshToken;

    this.api.use(
      pluginToken({
        getToken: async () => this.accessToken ?? '',
      }),
    );
  }

  async refresh(): Promise<string> {
    const token = await this.debouncedRefresh();
    this.accessToken = token;
    return token;
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

  async botLogin(payload: BotLoginPayload) {
    const res = await this.api['bots.login'](payload);
    return res;
  }

  async getBot(botId: string) {
    const res = await this.api['bots.get']({ params: { botId } });
    return res;
  }

  async updateBot(botId: string, payload: UpdateBotPayload) {
    const res = await this.api['bots.update'](payload, { params: { botId } });
    return res;
  }

  async deleteBot(botId: string) {
    const res = await this.api['bots.delete'](undefined, {
      params: { botId },
    });
    return res;
  }

  async regenerateBotToken(botId: string) {
    const res = await this.api['bots.regenerateToken'](undefined, {
      params: { botId },
    });
    return res;
  }

  async listBotSpaces(botId: string) {
    const res = await this.api['bots.listSpaces']({ params: { botId } });
    return res;
  }

  async installBot(botId: string, payload: InstallBotPayload) {
    const res = await this.api['bots.install'](payload, {
      params: { botId },
    });
    return res;
  }

  async removeBotFromSpace(botId: string, spaceId: string) {
    const res = await this.api['bots.removeFromSpace'](undefined, {
      params: { botId, spaceId },
    });
    return res;
  }
}

/**
 * Auth client for bot users. Authenticates using bot ID + secret token
 * instead of email/password + refresh tokens.
 */
export class BotAuthClient extends AuthClient {
  private botId: string;
  private botToken: string;

  constructor(options: BotAuthClientOptions) {
    super({ url: options.url });
    this.botId = options.botId;
    this.botToken = options.token;
  }

  override async refresh(): Promise<string> {
    const res = await this.api['bots.login']({
      botId: this.botId,
      token: this.botToken,
    });
    this.accessToken = res.accessToken;
    return res.accessToken;
  }
}
