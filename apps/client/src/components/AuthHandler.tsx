import { atom } from 'recoil';
import { useInterval } from '@mantine/hooks';

interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_PAIR = 'token_pair';

export const authTokenState = atom({
  key: 'authToken',
  default: null,
  effects: [
    ({ setSelf, onSet }) => {
      const savedValue = localStorage.getItem(TOKEN_PAIR);
      if (savedValue !== null) {
        setSelf(JSON.parse('token_pair'));
      }

      onSet((newValue, _, isReset) => {
        isReset
          ? localStorage.removeItem(TOKEN_PAIR)
          : localStorage.setItem(TOKEN_PAIR, JSON.stringify(newValue));
      });
    },
  ],
});

function AuthRefresher() {
  useInterval(() => {
    console.log('test lol'); // TODO: actually call refresh
  }, 2000);
  return null;
}
