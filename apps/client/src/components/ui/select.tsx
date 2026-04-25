'use client';

import type { CollectionItem } from '@chakra-ui/react';
import { Select as ChakraSelect, Portal } from '@chakra-ui/react';
import 'react';

import { CloseButton } from './close-button';

interface SelectTriggerProps extends ChakraSelect.ControlProps {
  clearable?: boolean;
}

export const SelectTrigger = function SelectTrigger(
  props: SelectTriggerProps & { ref: React.Ref<HTMLButtonElement> },
) {
  const { children, clearable, ref, ...rest } = props;
  return (
    <ChakraSelect.Control {...rest}>
      <ChakraSelect.Trigger ref={ref}>{children}</ChakraSelect.Trigger>
      <ChakraSelect.IndicatorGroup>
        {clearable && <SelectClearTrigger />}
        <ChakraSelect.Indicator />
      </ChakraSelect.IndicatorGroup>
    </ChakraSelect.Control>
  );
};

const SelectClearTrigger = function SelectClearTrigger(
  props: ChakraSelect.ClearTriggerProps,
) {
  return (
    <ChakraSelect.ClearTrigger asChild {...props}>
      <CloseButton
        size="xs"
        variant="plain"
        focusVisibleRing="inside"
        focusRingWidth="2px"
        pointerEvents="auto"
      />
    </ChakraSelect.ClearTrigger>
  );
};

interface SelectContentProps extends ChakraSelect.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement>;
}

export const SelectContent = function SelectContent(
  props: SelectContentProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { portalled = true, portalRef, ...rest } = props;
  return (
    <Portal disabled={!portalled} container={portalRef}>
      <ChakraSelect.Positioner>
        <ChakraSelect.Content {...rest} ref={ref} />
      </ChakraSelect.Positioner>
    </Portal>
  );
};

export const SelectItem = function SelectItem(
  props: ChakraSelect.ItemProps,
  ref,
) {
  const { item, children, ...rest } = props;
  return (
    <ChakraSelect.Item key={item.value} item={item} {...rest} ref={ref}>
      {children}
      <ChakraSelect.ItemIndicator />
    </ChakraSelect.Item>
  );
};

interface SelectValueTextProps
  extends Omit<ChakraSelect.ValueTextProps, 'children'> {
  children?(items: CollectionItem[]): React.ReactNode;
}

export const SelectValueText = function SelectValueText(
  props: SelectValueTextProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { children, ...rest } = props;
  return (
    <ChakraSelect.ValueText {...rest} ref={ref}>
      <ChakraSelect.Context>
        {(select) => {
          const items = select.selectedItems;
          if (items.length === 0) return props.placeholder;
          if (children) return children(items);
          if (items.length === 1)
            return select.collection.stringifyItem(items[0]);
          return `${items.length} selected`;
        }}
      </ChakraSelect.Context>
    </ChakraSelect.ValueText>
  );
};

export const SelectRoot = function SelectRoot(
  props: ChakraSelect.RootProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <ChakraSelect.Root
      {...props}
      ref={ref}
      positioning={{ sameWidth: true, ...props.positioning }}
    >
      {props.asChild ? (
        props.children
      ) : (
        <>
          <ChakraSelect.HiddenSelect />
          {props.children}
        </>
      )}
    </ChakraSelect.Root>
  );
};

interface SelectItemGroupProps extends ChakraSelect.ItemGroupProps {
  label: React.ReactNode;
}

export const SelectItemGroup = function SelectItemGroup(
  props: SelectItemGroupProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { children, label, ...rest } = props;
  return (
    <ChakraSelect.ItemGroup {...rest} ref={ref}>
      <ChakraSelect.ItemGroupLabel>{label}</ChakraSelect.ItemGroupLabel>
      {children}
    </ChakraSelect.ItemGroup>
  );
};

export const SelectLabel = ChakraSelect.Label;
export const SelectItemText = ChakraSelect.ItemText;
