import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
import { Channel } from '../models';
import React from 'react';
import { useSetRecoilState } from 'recoil';
import { contextMenuState } from './ContextMenu';

export const TreeContainer = styled.ul`
  height: 100%;
  list-style: none;
  margin: 0;
  padding: 10px;
  box-sizing: border-box;
`;

const TreeNodeElement = styled.li`
  font-size: 14px;
  height: 20px;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }
`;

interface TreeNodeProps extends React.HTMLAttributes<HTMLLIElement> {
  channel: Channel;
}

const IconContainer = styled.span`
  background-color: #3b83ff;
  color: white;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-right: 8px;
  width: 24px;
  height: 24px;
`;

export function TreeNode({ channel, ...props }: TreeNodeProps) {
  return (
    <TreeNodeElement {...props}>
      <IconContainer>
        <FontAwesomeIcon icon={faHashtag} />
      </IconContainer>
      {channel.name}
    </TreeNodeElement>
  );
}

export function TreeBar({
  channels,
  onClick,
}: {
  channels: Channel[];
  onClick: (channel: Channel) => void;
}) {
  const setContextMenu = useSetRecoilState(contextMenuState);

  return (
    <TreeContainer
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({
          position: { top: e.clientY, left: e.clientX },
          variant: { kind: 'treebar' },
        });
      }}
    >
      {channels.map((x) => (
        <TreeNode channel={x} key={x.id} onClick={() => onClick(x)} />
      ))}
    </TreeContainer>
  );
}
