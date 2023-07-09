import axios, { Axios } from 'axios';

import { TokenPair } from './models';

interface Bot {
  id: string;
  name: string;
  secret: string;
}

export class AuthClient {
  axios: Axios;
  constructor(baseUrl: string) {
    this.axios = axios.create({
      baseURL: baseUrl,
    });
  }

  async register(name: string, email: string, password: string) {
    const x = await this.axios.post<TokenPair>('/account/register', {
      name,
      email,
      password,
    });
    return x.data;
  }

  async login(email: string, password: string) {
    const x = await this.axios.post<TokenPair>('/account/login', {
      email,
      password,
    });
    return x.data;
  }

  async changePassword(id: string, oldPassword: string, newPassword: string) {
    return this.axios
      .post<TokenPair>('/account/change_password', {
        id,
        oldPassword,
        newPassword,
      })
      .then((x) => x.data);
  }

  async refresh(refreshToken: string) {
    const newPair = await this.axios
      .post<TokenPair>('/account/refresh', {
        refreshToken,
      })
      .then((x) => x.data);

    this.axios.defaults.headers.common.Authorization = `Bearer ${newPair.accessToken}`;
    return newPair;
  }

  resetPassword(email: string) {
    this.axios.post('/account/reset_password', { email });
  }

  async resetPasswordSubmit(newPassword: string, token: string) {
    return this.axios.post('/account/reset_password/submit', {
      newPassword,
      token,
    });
  }

  // bot works
  async listBots() {
    return this.axios.get<Bot[]>('/bots').then((x) => x.data);
  }

  async createBot(name: string) {
    return this.axios.post<Bot>('/bots', { name }).then((x) => x.data);
  }

  // for actual bot usage
  async authenticateBot(botKey: string) {
    return this.axios.post<TokenPair>('/bots/auth', { botKey });
  }
}
