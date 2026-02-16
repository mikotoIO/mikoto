// React 19 moved JSX types from the global namespace to React.JSX.
// This shim restores the global JSX namespace for backward compatibility
// with libraries (e.g. react-markdown v8) that reference it directly.
import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}
