import { MlsClient } from '@mikoto-io/mikoto-crypto';
import React, { useContext } from 'react';

const CryptoContext = React.createContext<MlsClient | null>(null);

export const CryptoProvider = CryptoContext.Provider;

/**
 * Access the MLS crypto client. Returns null if crypto hasn't been initialized yet.
 */
export function useCrypto(): MlsClient | null {
  return useContext(CryptoContext);
}
