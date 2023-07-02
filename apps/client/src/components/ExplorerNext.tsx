import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronDown,
  faChevronRight,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styled from 'styled-components';

export const StyledTreeBody = styled.div`
  margin: 0;
  padding: 10px;
  min-height: min-content;
  max-height: 100%;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
`;

const StyledNode = styled.a<{ unread?: boolean; isDndHover?: boolean }>`
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
  ${(p) => p.isDndHover && `color: ${p.theme.colors.B800}`}
`;

export interface NodeObject {
  id: string;
  text: string;
  icon?: IconDefinition;
  descendant?: NodeObject[];
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

interface NodeProps extends NodeObject {
  path: string[];
}

function Node(props: NodeProps) {
  const [open, setOpen] = useState(false);
  const isLeaf = props.descendant === undefined;

  const ref = useRef<HTMLAnchorElement>(null);
  const [, drag] = useDrag<NodeObject>({
    type: 'CHANNEL',
    item: props,
  });
  const [{ isOver }, drop] = useDrop<NodeObject, any, { isOver: boolean }>({
    accept: 'CHANNEL',
    async drop(item) {
      console.log(`Dropped ${item.text} on ${props.text}`);
    },

    canDrop(item) {
      return !props.path.includes(item.id);
    },

    collect(monitor) {
      return {
        isOver: monitor.isOver() && monitor.canDrop(),
      };
    },
  });
  drag(drop(ref));

  return (
    <div>
      <StyledNode
        ref={ref}
        onClick={(ev) => {
          props.onClick?.(ev);
        }}
        onContextMenu={(ev) => {
          props.onContextMenu?.(ev);
        }}
        isDndHover={isOver}
      >
        <ChevronWrapper
          onClick={(ev) => {
            ev.stopPropagation();
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
          props.descendant?.map((x) => (
            <Node {...x} path={[...props.path, x.id]} key={x.id} />
          ))}
      </StyledSubtree>
    </div>
  );
}

interface ExplorerNextProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: NodeObject[];
}

export function ExplorerNext({ nodes, ...props }: ExplorerNextProps) {
  return (
    <StyledTreeBody {...props}>
      {nodes.map((x) => (
        <Node {...x} path={[x.id]} key={x.id} />
      ))}
    </StyledTreeBody>
  );
}
