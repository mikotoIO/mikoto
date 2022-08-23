import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faHashtag,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import styled from 'styled-components';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Tabable } from '../../store';
import { centerFlex } from '../themes';

const StyledIcon = styled.span<{ size?: number }>`
  background-color: #3b83ff;
  color: white;
  border-radius: 3px;
  text-align: center;
  margin-right: 6px;
  width: ${(p) => p.size ?? 24}px;
  height: ${(p) => p.size ?? 24}px;
  ${centerFlex}
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

export function IconBox({ size, icon }: TabIconProps) {
  return (
    <StyledIcon size={size}>
      <FontAwesomeIcon icon={icon ?? faHashtag} />
    </StyledIcon>
  );
}
