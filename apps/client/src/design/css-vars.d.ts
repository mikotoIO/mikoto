import 'react';

// Allow CSS custom properties (e.g. `style={{ '--role': color }}`) without casts.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
