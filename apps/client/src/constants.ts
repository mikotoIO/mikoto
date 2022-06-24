const constants = {
  apiPath:
    window.location.host === 'dev.mikoto.io'
      ? 'https://server.dev.mikoto.io'
      : 'http://localhost:9500',
};

export default constants;
