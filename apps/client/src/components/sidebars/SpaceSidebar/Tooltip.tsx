import { FloatingTooltip } from '@/ui';

export function SpaceIconTooltip({
  children,
  tooltip,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactElement<any>;
  tooltip: string;
}) {
  return (
    <FloatingTooltip tooltip={tooltip} placement="right" offsetOptions={[0, 0]}>
      {children}
    </FloatingTooltip>
  );
}
