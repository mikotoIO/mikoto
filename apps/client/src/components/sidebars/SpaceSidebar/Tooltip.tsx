import Tippy from '@tippyjs/react';

import { Tooltip } from '@/ui';

export function SpaceIconTooltip({
  children,
  tooltip,
}: {
  children: React.ReactElement;
  tooltip: string;
}) {
  return (
    <Tippy
      animation={false}
      content={<Tooltip>{tooltip}</Tooltip>}
      placement="right"
      offset={[0, 0]}
    >
      {children}
    </Tippy>
  );
}
