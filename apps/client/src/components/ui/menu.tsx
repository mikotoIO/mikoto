'use client';

import { AbsoluteCenter, Menu as ChakraMenu, Portal } from '@chakra-ui/react';
import 'react';
import { LuCheck, LuChevronRight } from 'react-icons/lu';

interface MenuContentProps extends ChakraMenu.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
}

export const MenuContent = function MenuContent(props: MenuContentProps) {
  const { portalled = true, portalRef, ...rest } = props;
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraMenu.Positioner>
        <ChakraMenu.Content {...rest} />
      </ChakraMenu.Positioner>
    </Portal>
  );
};

export const MenuArrow = function MenuArrow(props: ChakraMenu.ArrowProps) {
  return (
    <ChakraMenu.Arrow {...props}>
      <ChakraMenu.ArrowTip />
    </ChakraMenu.Arrow>
  );
};

export const MenuCheckboxItem = function MenuCheckboxItem(
  props: ChakraMenu.CheckboxItemProps,
) {
  return (
    <ChakraMenu.CheckboxItem {...props}>
      <ChakraMenu.ItemIndicator hidden={false}>
        <LuCheck />
      </ChakraMenu.ItemIndicator>
      {props.children}
    </ChakraMenu.CheckboxItem>
  );
};

export const MenuRadioItem = function MenuRadioItem(
  props: ChakraMenu.RadioItemProps,
) {
  const { children, ...rest } = props;
  return (
    <ChakraMenu.RadioItem ps="8" {...rest}>
      <AbsoluteCenter axis="horizontal" left="4" asChild>
        <ChakraMenu.ItemIndicator>
          <LuCheck />
        </ChakraMenu.ItemIndicator>
      </AbsoluteCenter>
      <ChakraMenu.ItemText>{children}</ChakraMenu.ItemText>
    </ChakraMenu.RadioItem>
  );
};

export const MenuItemGroup = function MenuItemGroup(
  props: ChakraMenu.ItemGroupProps,
) {
  const { title, children, ...rest } = props;
  return (
    <ChakraMenu.ItemGroup {...rest}>
      {title && (
        <ChakraMenu.ItemGroupLabel userSelect="none">
          {title}
        </ChakraMenu.ItemGroupLabel>
      )}
      {children}
    </ChakraMenu.ItemGroup>
  );
};

export interface MenuTriggerItemProps extends ChakraMenu.ItemProps {
  startIcon?: React.ReactNode;
}

export const MenuTriggerItem = function MenuTriggerItem(
  props: MenuTriggerItemProps,
) {
  const { startIcon, children, ...rest } = props;
  return (
    <ChakraMenu.TriggerItem {...rest}>
      {startIcon}
      {children}
      <LuChevronRight />
    </ChakraMenu.TriggerItem>
  );
};

export const MenuRadioItemGroup = ChakraMenu.RadioItemGroup;
export const MenuContextTrigger = ChakraMenu.ContextTrigger;
export const MenuRoot = ChakraMenu.Root;
export const MenuSeparator = ChakraMenu.Separator;

export const MenuItem = ChakraMenu.Item;
export const MenuItemText = ChakraMenu.ItemText;
export const MenuItemCommand = ChakraMenu.ItemCommand;
export const MenuTrigger = ChakraMenu.Trigger;
