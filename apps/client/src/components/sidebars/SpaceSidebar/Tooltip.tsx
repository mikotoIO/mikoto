import { FloatingTooltip } from '@/ui';

export function SpaceIconTooltip({
  children,
  tooltip,
}: {
   
  children: React.ReactElement<any>;
  tooltip: string;
}) {
  return (
    <FloatingTooltip tooltip={tooltip} placement="right" offsetOptions={[0, 0]}>
      {children}
    </FloatingTooltip>
  );
}
