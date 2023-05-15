import { MikotoClient } from 'mikotojs';
import React, { useContext } from 'react';

import { useInterval } from './useInterval';

export { useInterval };

export const MikotoContext = React.createContext<MikotoClient>(undefined!);

export function useMikoto() {
  return useContext(MikotoContext);
}

export function useEvent() {
  
}
