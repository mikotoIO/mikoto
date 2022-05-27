import { atom, useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

import { useInterval } from '../hooks';
import { TokenPair } from '../models';
import { useMikoto } from '../api';
import { refresh } from '../api/auth';

const TOKEN_PAIR = 'token_pair';

export const authTokenState = atom<TokenPair | null>({
  key: 'authToken',
  default: null,
  effects: [
    ({ setSelf, onSet }) => {
      const savedValue = localStorage.getItem(TOKEN_PAIR);
      if (savedValue !== null) {
        setSelf(JSON.parse(savedValue));
      }
      const storageFn = (ev: StorageEvent) => {
        if (
          ev.key === TOKEN_PAIR &&
          ev.newValue &&
          ev.newValue !== localStorage.getItem(TOKEN_PAIR)
        ) {
          setSelf(JSON.parse(ev.newValue));
        }
      };
      window.addEventListener('storage', storageFn);

      onSet((newValue, _, isReset) => {
        console.log('lolwut');
        if (isReset) {
          localStorage.removeItem(TOKEN_PAIR);
        } else {
          localStorage.setItem(TOKEN_PAIR, JSON.stringify(newValue));
        }
      });
      return () => {
        window.removeEventListener('storage', storageFn);
      };
    },
  ],
});

// TODO: this is effectful. make this less effectful.
export function AuthRefresher({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useRecoilState(authTokenState);
  const [completed, setCompleted] = useState(false);
  const mikoto = useMikoto();

  const updateTokenLogic = async () => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    const r = jwtDecode<{ exp: number }>(authToken.accessToken);
    const secondsUntilExpiry = r.exp - Date.now() / 1000;

    if (secondsUntilExpiry <= 6000) {
      const newToken = await refresh(authToken);
      setAuthToken(newToken);
      mikoto.updateAccessToken(newToken.accessToken);
    } else {
      mikoto.updateAccessToken(authToken.accessToken);
    }

    setCompleted(true);
  };

  useEffect(() => {
    updateTokenLogic().then();
  }, []);

  useInterval(async () => {
    await updateTokenLogic();
  }, 5 * 60 * 1000);
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{completed && children}</>;
}
