import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronDown,
  faChevronRight,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import styled from 'styled-components';

export const StyledTreeBody = styled.div`
  margin: 0;
  padding: 10px;
  min-height: min-content;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
`;

const StyledNode = styled.a<{ unread?: boolean }>`
  position: relative;
  font-size: 14px;
  height: 20px;
  padding: 6px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-weight: ${(p) => (p.unread ? '600' : 'inherit')};
  color: ${(p) => (p.unread ? 'white' : 'rgba(255, 255, 255, 0.8)')};
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }
`;

interface NodeProps {
  id: string;
  text: string;
  icon?: IconDefinition;
  descendant?: NodeProps[];
  onClick?(ev: React.MouseEvent): void;
  onContextMenu?(ev: React.MouseEvent): void;
}

const ChevronWrapper = styled.div`
  opacity: 0.3;
  font-size: 10px;
  width: 10px;
  margin-right: 8px;
  text-align: center;
`;

export const StyledSubtree = styled.div`
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

function Node(props: NodeProps) {
  const [open, setOpen] = useState(false);
  const isLeaf = props.descendant === undefined;
  return (
    <div>
      <StyledNode
        onClick={(ev) => {
          props.onClick?.(ev);
        }}
        onContextMenu={(ev) => {
          props.onContextMenu?.(ev);
        }}
      >
        <ChevronWrapper
          onClick={() => {
            if (!isLeaf) setOpen(!open);
          }}
        >
          {!isLeaf ? (
            <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight} />
          ) : (
            <FontAwesomeIcon icon={props.icon ?? faHashtag} />
          )}
        </ChevronWrapper>
        {props.text}
      </StyledNode>
      <StyledSubtree>
        {open &&
          !isLeaf &&
          props.descendant?.map((x) => <Node {...x} key={x.id} />)}
      </StyledSubtree>
    </div>
  );
}

interface ExplorerNextProps {
  nodes: NodeProps[];
}

export function ExplorerNext(props: ExplorerNextProps) {
  return (
    <StyledTreeBody>
      {props.nodes.map((x) => (
        <Node {...x} key={x.id} />
      ))}
      {/*        <Node
          text="General"
          descendant={[
            { text: '🗒️ Thread 1', descendant: [{ text: 'Subthread 1' }] },
            { text: '🗒️ Thread 2' },
          ]}
        />
        <Node text="Memes" />
        <Node text="🌸 Anime" />
        <Node text="Voice" icon={faHeadset} />
        <Node text="Document" icon={faBarsStaggered} />*/}
    </StyledTreeBody>
  );
}
