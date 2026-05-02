import { Accordion, HStack } from '@chakra-ui/react';
import 'react';
import { LuChevronDown } from 'react-icons/lu';

interface AccordionItemTriggerProps extends Accordion.ItemTriggerProps {
  indicatorPlacement?: 'start' | 'end';
}

export const AccordionItemTrigger = function AccordionItemTrigger(
  props: AccordionItemTriggerProps,
) {
  const { children, indicatorPlacement = 'end', ...rest } = props;
  return (
    <Accordion.ItemTrigger {...rest}>
      {indicatorPlacement === 'start' && (
        <Accordion.ItemIndicator rotate={{ base: '-90deg', _open: '0deg' }}>
          <LuChevronDown />
        </Accordion.ItemIndicator>
      )}
      <HStack gap="4" flex="1" textAlign="start" width="full">
        {children}
      </HStack>
      {indicatorPlacement === 'end' && (
        <Accordion.ItemIndicator>
          <LuChevronDown />
        </Accordion.ItemIndicator>
      )}
    </Accordion.ItemTrigger>
  );
};

export const AccordionItemContent = function AccordionItemContent(
  props: Accordion.ItemContentProps,
) {
  return (
    <Accordion.ItemContent>
      <Accordion.ItemBody {...props} />
    </Accordion.ItemContent>
  );
};

export const AccordionRoot = Accordion.Root;
export const AccordionItem = Accordion.Item;
