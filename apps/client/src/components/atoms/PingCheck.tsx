import { useInterval } from 'usehooks-ts';

import { useMikoto } from '../../hooks';

function wait(ms: number) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout succeeded')), ms);
  });
}

export function PingCheck() {
  const mikoto = useMikoto();

  useInterval(() => {
    Promise.race([wait(15 * 1000), mikoto.client.ping({})])
    .catch(() => {
      console.error('Ping failed, websocket timeout');
      window.location.reload();
    });
  }, 15 * 1000);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}
