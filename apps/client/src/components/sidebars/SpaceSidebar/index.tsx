import { Divider } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useSnapshot } from 'valtio/react';

import { modalState, useContextMenu } from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { StyledSpaceIcon } from '@/components/atoms/SpaceIcon';
import { faMikoto } from '@/components/icons';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { reorder } from '@/functions/reorder';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, workspaceState } from '@/store';

import { Pill } from './Pill';
import { SpaceBackContextMenu, SpaceContextMenu } from './SpaceContextMenu';
import { SpaceIconTooltip } from './Tooltip';

const StyledSpaceSidebar = styled.div`
  align-items: center;
  box-sizing: border-box;

  flex-grow: 1;
  overflow: scroll;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

const StyledIconWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
`;

interface SidebarSpaceIconProps {
  space: MikotoSpace;
}

interface UseCombinedDnDProps<T> {
  type: string;
  item: T;
  onDrop: (from: T, to: T) => void;
}

function useCombinedDnD<T>(
  { type, item, onDrop }: UseCombinedDnDProps<T>,
  deps?: unknown[],
) {
  const [, drag] = useDrag<T>(
    () => ({
      type,
      item,
    }),
    deps,
  );
  const [, drop] = useDrop<T>(
    {
      accept: type,
      drop: (from) => {
        onDrop(from, item);
      },
    },
    deps,
  );
  return { drag, drop };
}

function CombinedDnD<T>({
  type,
  item,
  onDrop,
  children,
  deps,
}: UseCombinedDnDProps<T> & {
  children: React.ReactNode;
  deps?: unknown[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { drag, drop } = useCombinedDnD({ type, item, onDrop }, deps);
  drag(drop(ref));
  return <div ref={ref}>{children}</div>;
}

function SidebarSpaceIcon({ space }: SidebarSpaceIconProps) {
  // TODO: TF is this name?
  const [leftSidebar, setLeftSidebar] = useRecoilState(treebarSpaceState);
  const isActive =
    leftSidebar &&
    leftSidebar.kind === 'explorer' &&
    leftSidebar.spaceId === space.id;
  const setWorkspace = useSetRecoilState(workspaceState);

  const contextMenu = useContextMenu(() => <SpaceContextMenu space={space} />);

  return (
    <SpaceIconTooltip tooltip={space.name}>
      <StyledIconWrapper>
        <Pill h={isActive ? 32 : 0} />
        <StyledSpaceIcon
          onContextMenu={contextMenu}
          icon={space.icon ? normalizeMediaUrl(space.icon) : undefined}
          onDoubleClick={() => {
            setWorkspace((x) => ({ ...x, leftOpen: !x.leftOpen }));
          }}
          onClick={() => {
            setLeftSidebar({
              kind: 'explorer',
              key: `explorer/${space.id}`,
              spaceId: space.id,
            });
            // FIXME: correctly fetch members
            // space.fetchMembers().then();
          }}
        >
          {space.icon === null ? space.name[0] : ''}
        </StyledSpaceIcon>
      </StyledIconWrapper>
    </SpaceIconTooltip>
  );
}

// order spaces in the same order as the array of IDs
// if an ID is not in the array, it is pushed to the end
function orderSpaces(mikoto: MikotoClient, order: string[]) {
  const ordered: MikotoSpace[] = [];
  const unordered: MikotoSpace[] = [];
  const keys = new Set(mikoto.spaces.cache.keys());
  order.forEach((id) => {
    const space = mikoto.spaces._get(id);
    if (space && space.type === 'NONE') {
      ordered.push(space);
    }
    keys.delete(id);
  });

  keys.forEach((id) => {
    const space = mikoto.spaces._get(id);
    if (space && space.type === 'NONE') {
      unordered.push(space);
    }
  });
  const res = [...ordered, ...unordered];
  return [res, unordered.length === 0] as const;
}

function JoinSpaceButon() {
  const setModal = useSetRecoilState(modalState);

  return (
    <SpaceIconTooltip tooltip="Add / Join Space">
      <StyledIconWrapper>
        <StyledSpaceIcon
          color="blue.500"
          fontSize="18px"
          onClick={() => {
            setModal({
              elem: <SpaceJoinModal />,
            });
          }}
        >
          <FontAwesomeIcon icon={faCirclePlus} />
        </StyledSpaceIcon>
      </StyledIconWrapper>
    </SpaceIconTooltip>
  );
}

export function SpaceSidebar() {
  const mikoto = useMikoto();
  const [spaceId, setSpaceId] = useRecoilState(treebarSpaceState);

  useSnapshot(mikoto.spaces);
  const contextMenu = useContextMenu(() => <SpaceBackContextMenu />);

  const [order, setOrder] = useState<string[]>(() =>
    // TODO: persist to server
    JSON.parse(localStorage.getItem('spaceOrder') ?? '[]')
  );
  const [spaceArray, isOrdered] = orderSpaces(mikoto, order);
  if (!isOrdered) {
    setOrder(spaceArray.map((x) => x.id));
    return null;
  }

  return (
    <StyledSpaceSidebar onContextMenu={contextMenu}>
      <StyledIconWrapper style={{ marginTop: '8px' }}>
        <Pill h={spaceId === null ? 32 : 0} />
        <StyledSpaceIcon
          style={{
            background: spaceId === null
              ? 'linear-gradient(133deg, #2298ff 0%, rgba(59,108,255,1) 100%)'
              : undefined,
          }}
          onClick={() => {
            setSpaceId(null);
          } }
        >
          <FontAwesomeIcon icon={faMikoto} fontSize="28px" />
        </StyledSpaceIcon>
      </StyledIconWrapper>
      <Divider w={8} />

      {spaceArray
        .filter((x) => x.type === 'NONE') // TODO: filter this on the server
        .map((space, index) => (
          <CombinedDnD
            key={space.id}
            type="SPACE"
            item={{ spaceId: space.id, index }}
            onDrop={(from, to) => {
              setOrder((spaceOrders) => {
                const reordered = reorder(spaceOrders, from.index, to.index);
                localStorage.setItem('spaceOrder', JSON.stringify(reordered));
                return reordered;
              });
            } }
            deps={[index]}
          >
            <SidebarSpaceIcon space={space} />
          </CombinedDnD>
        ))}
      <JoinSpaceButon />
    </StyledSpaceSidebar>
  );
}
