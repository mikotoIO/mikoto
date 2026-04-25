import { HoverCard, Portal } from '@chakra-ui/react';
import 'react';

interface HoverCardContentProps extends HoverCard.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
}

export const HoverCardContent = function HoverCardContent(props: HoverCardContentProps, ref) {
  const { portalled = true, portalRef, ...rest } = props;

  return (
    <Portal disabled={!portalled} container={portalRef}>
      <HoverCard.Positioner>
        <HoverCard.Content ref={ref} {...rest} />
      </HoverCard.Positioner>
    </Portal>
  );
};

export const HoverCardArrow = function HoverCardArrow(props: HoverCard.ArrowProps, ref) {
  return (
    <HoverCard.Arrow ref={ref} {...props}>
      <HoverCard.ArrowTip />
    </HoverCard.Arrow>
  );
};

export const HoverCardRoot = HoverCard.Root;
export const HoverCardTrigger = HoverCard.Trigger;
