import axios, { Axios } from 'axios';

import { TokenPair } from './models';

export class AuthClient {
  axios: Axios;
  constructor(baseUrl: string) {
    this.axios = axios.create({
      baseURL: baseUrl,
    });
  }

  register(name: string, email: string, password: string) {
    return this.axios
      .post<TokenPair>('/account/register', {
        name,
        email,
        password,
      })
      .then((x) => x.data);
  }

  login(email: string, password: string) {
    return this.axios
      .post<TokenPair>('/account/login', {
        email,
        password,
      })
      .then((x) => x.data);
  }

  refresh(pair: TokenPair) {
    return this.axios
      .post<TokenPair>('/account/refresh', {
        refreshToken: pair.refreshToken,
      })
      .then((x) => x.data);
  }

  resetPassword(email: string) {
    this.axios.post('/account/reset_password', { email });
  }

  async resetPasswordSubmit(newPassword: string, token: string) {
    return this.axios.post('/account/reset_password/submit', { newPassword, token });
  }
}
