import { Popover as ChakraPopover, Portal } from '@chakra-ui/react';
import 'react';

import { CloseButton } from './close-button';

interface PopoverContentProps extends ChakraPopover.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
}

export const PopoverContent = function PopoverContent(
  props: PopoverContentProps,
) {
  const { portalled = true, portalRef, ...rest } = props;
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraPopover.Positioner>
        <ChakraPopover.Content {...rest} />
      </ChakraPopover.Positioner>
    </Portal>
  );
};

export const PopoverArrow = function PopoverArrow(
  props: ChakraPopover.ArrowProps,
) {
  return (
    <ChakraPopover.Arrow {...props}>
      <ChakraPopover.ArrowTip />
    </ChakraPopover.Arrow>
  );
};

export const PopoverCloseTrigger = function PopoverCloseTrigger(
  props: ChakraPopover.CloseTriggerProps,
) {
  return (
    <ChakraPopover.CloseTrigger
      position="absolute"
      top="1"
      insetEnd="1"
      {...props}
      asChild
    >
      <CloseButton size="sm" />
    </ChakraPopover.CloseTrigger>
  );
};

export const PopoverTitle = ChakraPopover.Title;
export const PopoverDescription = ChakraPopover.Description;
export const PopoverFooter = ChakraPopover.Footer;
export const PopoverHeader = ChakraPopover.Header;
export const PopoverRoot = ChakraPopover.Root;
export const PopoverBody = ChakraPopover.Body;
export const PopoverTrigger = ChakraPopover.Trigger;
