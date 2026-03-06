import { cloneElement, useState } from 'react';

import { chakra } from '@chakra-ui/react';
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react';

export const Tooltip = chakra('div', {
  base: {
    color: 'white',
    backgroundColor: 'gray.900',
    borderRadius: '4px',
    padding: '6px 8px',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: 'rgba(0, 0, 0, 0.2) 0 8px 24px',
    zIndex: 9999,
  },
});

interface FloatingTooltipProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactElement<any>;
  tooltip: string;
  placement?: Placement;
  offsetOptions?: [number, number];
}

export function FloatingTooltip({
  children,
  tooltip,
  placement = 'top',
  offsetOptions,
}: FloatingTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset({
        mainAxis: offsetOptions?.[1] ?? 6,
        crossAxis: offsetOptions?.[0] ?? 0,
      }),
      flip(),
      shift(),
    ],
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      {cloneElement(children, {
        ref: refs.setReference,
        ...getReferenceProps(),
      })}
      {isOpen && (
        <FloatingPortal>
          <Tooltip
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {tooltip}
          </Tooltip>
        </FloatingPortal>
      )}
    </>
  );
}

export function createTooltip(props: {
  placement?: Placement;
  offset?: [number, number];
}) {
  return function CreatedTooltip({
    children,
    tooltip,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: React.ReactElement<any>;
    tooltip: string;
  }) {
    return (
      <FloatingTooltip
        tooltip={tooltip}
        placement={props.placement}
        offsetOptions={props.offset}
      >
        {children}
      </FloatingTooltip>
    );
  };
}
