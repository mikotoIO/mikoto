export const env = {
  DEV: import.meta.env.DEV,
  PUBLIC_FRONTEND_URL:
    import.meta.env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173',
  PUBLIC_AUTH_URL: import.meta.env.PUBLIC_AUTH_URL ?? 'http://localhost:9500',
  PUBLIC_SERVER_URL:
    import.meta.env.PUBLIC_SERVER_URL ?? 'http://localhost:3510',
  PUBLIC_MEDIASERVER_URL:
    import.meta.env.PUBLIC_MEDIASERVER_URL ?? 'http://localhost:9501',
  PUBLIC_CAPTCHA_KEY:
    import.meta.env.PUBLIC_CAPTCHA_KEY ?? '3x00000000000000000000FF',
};
