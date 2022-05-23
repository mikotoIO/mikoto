import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faHashtag,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import styled from 'styled-components';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tabable } from '../store';

const IconContainer = styled.span<{ size?: number }>`
  background-color: #3b83ff;
  color: white;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-right: 8px;
  width: ${(p) => p.size ?? 24}px;
  height: ${(p) => p.size ?? 24}px;
`;

interface TabIconProps {
  size?: number;
  icon?: IconDefinition;
}

export function getTabIcon(tab: Tabable): IconDefinition {
  switch (tab.kind) {
    case 'textChannel':
      return faHashtag;
    case 'spaceSettings':
      return faCog;
    default:
      return faQuestion;
  }
}

export function TabIcon({ size, icon }: TabIconProps) {
  return (
    <IconContainer size={size}>
      <FontAwesomeIcon icon={icon ?? faHashtag} />
    </IconContainer>
  );
}
