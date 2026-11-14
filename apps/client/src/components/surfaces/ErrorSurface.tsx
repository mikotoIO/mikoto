import { type FallbackProps } from 'react-error-boundary';

import { Surface } from '@/components/Surface';
import { TabName } from '@/components/tabs';
import { ErrorState } from '@/design';

/**
 * Fallback for a crashed tab. Prefer wrapping surfaces in
 * <SurfaceErrorBoundary what="#general"> so the message names what failed.
 */
export function ErrorSurface({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Surface>
      <TabName name="Didn't load" />
      <ErrorState
        what="This tab"
        error={error}
        onRetry={resetErrorBoundary}
        note="Your other tabs aren't affected."
      />
    </Surface>
  );
}
