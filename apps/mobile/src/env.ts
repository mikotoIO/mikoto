import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const env = {
  PUBLIC_SERVER_URL:
    extra.PUBLIC_SERVER_URL ?? process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3511',
  PUBLIC_MEDIASERVER_URL:
    extra.PUBLIC_MEDIASERVER_URL ?? process.env.EXPO_PUBLIC_MEDIASERVER_URL ?? 'http://localhost:9501',
  PUBLIC_COLLABORATION_URL:
    extra.PUBLIC_COLLABORATION_URL ?? process.env.EXPO_PUBLIC_COLLABORATION_URL ?? 'ws://localhost:1234',
};
