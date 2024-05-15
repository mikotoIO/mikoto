import { chakra } from '@chakra-ui/react';
import styled from '@emotion/styled';

import { viewContainerCss } from '@/components/Surface';

const SettingsViewBase = chakra('div', {
  baseStyle: {
    px: '8px',
    py: '32px',
    overflowY: 'scroll',
  },
});

const Sidebar = chakra('div', {
  baseStyle: {
    p: 4,
  },
});

const Container = styled.div`
  ${viewContainerCss}

  height: 100%;
  display: grid;
  grid-template-columns: 200px 1fr;
`;

const Nav = styled.a<{ active?: boolean }>`
  display: block;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: ${(p) =>
    p.active ? `var(--chakra-colors-gray-650)` : 'transparent'};
  color: var(--chakra-colors-white);
  user-select: none;
`;

export const SettingsView = Object.assign(SettingsViewBase, {
  Container,
  Sidebar,
  Nav,
});
