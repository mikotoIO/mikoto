import { chakra } from '@chakra-ui/react';
import Tippy, { TippyProps } from '@tippyjs/react';

export const Tooltip = chakra('div', {
  base: {
    color: 'white',
    backgroundColor: 'gray.900',
    borderRadius: '4px',
    padding: '6px 8px',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: 'rgba(0, 0, 0, 0.2) 0 8px 24px',
  },
});

export function createTooltip(props: Omit<TippyProps, 'content'>) {
  return function CreatedTooltip({
    children,
    tooltip,
  }: {
    children: React.ReactElement;
    tooltip: string;
  }) {
    return (
      <Tippy content={<Tooltip>{tooltip}</Tooltip>} {...props}>
        {children}
      </Tippy>
    );
  };
}
