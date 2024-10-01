import { AuthClient, MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import React, { useContext, useEffect } from 'react';

import { useInterval } from './useInterval';

export { useInterval };

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto(): MikotoClient {
  return useContext(MikotoContext);
}

export const AuthContext = React.createContext<AuthClient>(undefined!);

export function useAuthClient() {
  return useContext(AuthContext);
}

export function useEvent() {}

export const useFetchMember = (space: MikotoSpace) => {
  useEffect(() => {
    space.members.list();
  }, [space.id]);
};
