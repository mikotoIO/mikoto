import { chakra } from '@chakra-ui/react';
import {
  faChevronDown,
  faChevronRight,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import styled from '@emotion/styled';

import { ExplorerNode, nodeSort } from './explorerNode';

export const StyledTreeBody = styled.div`
  margin: 0;
  padding: 4px;
  min-height: min-content;
  max-height: 100%;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
`;

const NodeBase = chakra('a', {
  base: {
    position: 'relative',
    fontSize: '14px',
    height: '32px',
    px: '8px',
    py: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'inherit',
    color: 'gray.350',
    cursor: 'pointer',
    userSelect: 'none',
    _hover: {
      backgroundColor: 'gray.650',
    },
  },
});

const ChevronWrapper = styled.div`
  opacity: 0.4;
  font-size: 12px;
  width: 10px;
  margin-right: 8px;
  text-align: center;
`;

export const StyledSubtree = styled.div`
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

function Node(props: ExplorerNode & { path: string[] }) {
  const [open, setOpen] = useState(false);
  const isLeaf = props.descendant === undefined;

  const ref = useRef<HTMLAnchorElement>(null);
  const [, drag] = useDrag<ExplorerNode>({
    type: 'CHANNEL',
    item: props,
  });
  const [{ isOver }, drop] = useDrop<ExplorerNode, any, { isOver: boolean }>({
    accept: 'CHANNEL',
    async drop(item) {
      // console.log(`Dropped ${item.text} on ${props.text}`);
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
      <NodeBase
        ref={ref}
        onClick={props.onClick}
        onContextMenu={props.onContextMenu}
        color={props.unread ? 'text' : undefined}
        fontWeight={props.unread ? '600' : undefined}
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
        <span>{props.text}</span>
      </NodeBase>
      <StyledSubtree>
        {open &&
          !isLeaf &&
          nodeSort(props.descendant)?.map((x) => (
            <Node {...x} path={[...props.path, x.id]} key={x.id} />
          ))}
      </StyledSubtree>
    </div>
  );
}

export function ChannelTree({
  nodes,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  nodes: ExplorerNode[];
}) {
  return (
    <StyledTreeBody {...props}>
      {nodeSort(nodes)?.map((x) => <Node {...x} path={[x.id]} key={x.id} />)}
    </StyledTreeBody>
  );
}
