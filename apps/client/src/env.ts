export const env = {
  DEV: import.meta.env.DEV,
  PUBLIC_FRONTEND_URL:
    import.meta.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173',
  PUBLIC_SERVER_URL:
    import.meta.env.PUBLIC_SERVER_URL ?? 'http://localhost:9503',
  PUBLIC_MEDIASERVER_URL:
    import.meta.env.PUBLIC_MEDIASERVER_URL ?? 'http://localhost:9501',
  PUBLIC_COLLABORATION_URL:
    import.meta.env.PUBLIC_COLLABORATION_URL ?? 'ws://localhost:1234',
  PUBLIC_CAPTCHA_KEY:
    import.meta.env.PUBLIC_CAPTCHA_KEY ?? '1x00000000000000000000AA',
};
