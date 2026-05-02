import { isMobile } from 'react-device-detect';

// Not a real hook — wraps a static module-level constant from
// `react-device-detect`. Kept as a hook-shaped API so consumers can later
// swap it for a responsive media-query hook without churn.
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useIsMobile(): boolean {
  return isMobile;
}
