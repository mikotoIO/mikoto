import axios from 'axios';
import constants from '../constants';
import { TokenPair } from '../models';

const authAxios = axios.create({
  baseURL: constants.apiPath,
});

export async function register(name: string, email: string, password: string) {
  const { data } = await authAxios.post<TokenPair>('/account/register', {
    name,
    email,
    password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await authAxios.post<TokenPair>('/account/login', {
    email,
    password,
  });
  return data;
}

export async function refresh(pair: TokenPair) {
  const { data } = await authAxios.post<TokenPair>('/account/refresh', {
    refreshToken: pair.refreshToken,
  });
  return data;
}
