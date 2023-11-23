import { AuthClient, ClientSpace, MikotoClient } from 'mikotojs';
import React, { useContext, useEffect } from 'react';

import { useInterval } from './useInterval';

export { useInterval };

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}

export const AuthContext = React.createContext<AuthClient>(undefined!);

export function useAuthClient() {
  return useContext(AuthContext);
}

export function useEvent() {}

export const useFetchMember = (space: ClientSpace) => {
  useEffect(() => {
    space.fetchMembers();
  }, [space.id]);
};
