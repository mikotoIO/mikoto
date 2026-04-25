import { ActionBar, Portal } from '@chakra-ui/react';
import 'react';

import { CloseButton } from './close-button';

interface ActionBarContentProps extends ActionBar.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
}

export const ActionBarContent = function ActionBarContent(props: ActionBarContentProps, ref) {
  const { children, portalled = true, portalRef, ...rest } = props;

  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ActionBar.Positioner>
        <ActionBar.Content ref={ref} {...rest} asChild={false}>
          {children}
        </ActionBar.Content>
      </ActionBar.Positioner>
    </Portal>
  );
};

export const ActionBarCloseTrigger = function ActionBarCloseTrigger(props: ActionBar.CloseTriggerProps, ref) {
  return (
    <ActionBar.CloseTrigger {...props} asChild ref={ref}>
      <CloseButton size="sm" />
    </ActionBar.CloseTrigger>
  );
};

export const ActionBarRoot = ActionBar.Root;
export const ActionBarSelectionTrigger = ActionBar.SelectionTrigger;
export const ActionBarSeparator = ActionBar.Separator;
