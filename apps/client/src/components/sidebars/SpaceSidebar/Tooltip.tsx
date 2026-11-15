import { type ReactElement } from 'react';

import { Tooltip } from '@/design';

/** Space name to the right of a rail icon. */
export function SpaceIconTooltip({
  children,
  tooltip,
}: {
  children: ReactElement;
  tooltip: string;
}) {
  return (
    <Tooltip content={tooltip} side="right">
      {children}
    </Tooltip>
  );
}
