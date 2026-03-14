import { isMobile } from 'react-device-detect';

export function useIsMobile(): boolean {
  return isMobile;
}
