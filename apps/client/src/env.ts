export const env = {
  PUBLIC_AUTH_URL: import.meta.env.PUBLIC_AUTH_URL ?? 'http://localhost:9500',
  PUBLIC_SERVER_URL:
    import.meta.env.PUBLIC_SERVER_URL ?? 'http://localhost:3510',
  PUBLIC_MEDIASERVER_URL:
    import.meta.env.PUBLIC_MEDIASERVER_URL ?? 'http://localhost:9501',
};
