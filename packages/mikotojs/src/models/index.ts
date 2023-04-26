export interface AppError {
  name: string;
  message: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export * from '../schema';
export * from './permissions';
