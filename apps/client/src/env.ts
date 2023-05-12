export const env = {
  PUBLIC_AUTH: import.meta.env.MIKOTO_AUTH ?? 'http://localhost:9500',
  PUBLIC_SERVER: import.meta.env.MIKOTO_SERVER ?? 'http://localhost:3510',
  PUBLIC_MEDIASERVER_URL:
    import.meta.env.MIKOTO_MEDIASERVER_URL ?? 'http://localhost:9501',
};
