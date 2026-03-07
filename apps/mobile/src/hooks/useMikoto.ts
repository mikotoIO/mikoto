import { useContext } from 'react';

import { AuthContext, MikotoContext } from '../lib/MikotoClientProvider';

export function useMikoto() {
  const ctx = useContext(MikotoContext);
  if (!ctx) {
    throw new Error('useMikoto must be used within a MikotoClientProvider');
  }
  return ctx;
}

export function useAuth() {
  return useContext(AuthContext);
}
