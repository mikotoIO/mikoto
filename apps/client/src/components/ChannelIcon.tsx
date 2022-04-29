import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import styled from 'styled-components';

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

export function ChannelIcon({ size }: { size?: number }) {
  return (
    <IconContainer size={size}>
      <FontAwesomeIcon icon={faHashtag} />
    </IconContainer>
  );
}
