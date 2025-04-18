import { Box, Button, Flex, Grid } from '@chakra-ui/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
  faBarsStaggered,
  faQuestion,
  faX,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { action, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Helmet } from 'react-helmet-async';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { ContextMenu, useContextMenu } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { channelToTab } from '@/components/surfaces/Explorer/channelToTab';
import type { ExplorerNode } from '@/components/surfaces/Explorer/explorerNode';
import { useMikoto } from '@/hooks';
import { workspaceState } from '@/store';
import {
  TabContext,
  TabNameProps,
  Tabable,
  surfaceStore,
  tabNameFamily,
} from '@/store/surface';

import { IconBox } from './IconBox';
import { WelcomeToMikoto } from './Welcome';

export function TabName({ name, icon }: TabNameProps) {
  const tabInfo = useContext(TabContext);
  const [tabName, setTabName] = useRecoilState(tabNameFamily(tabInfo.key));
  useEffect(() => {
    if (tabName.name !== name) {
      setTabName({
        ...tabName,
        name,
        icon,
      });
    }
  }, [name]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}

// noinspection CssUnknownProperty
const StyledRest = styled.div`
  flex-grow: 1;
  -webkit-app-region: drag;
`;

export const TabBarButton = styled.button`
  border: none;
  margin: 4px 8px 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;

  color: var(--chakra-colors-gray-300);
  background-color: transparent;
  &:hover {
    background-color: var(--chakra-colors-gray-700);
  }
`;

const TAB_HEIGHT = 36;
