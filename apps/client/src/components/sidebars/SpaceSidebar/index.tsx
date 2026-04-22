import { Separator } from '@chakra-ui/react';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import styled from '@emotion/styled';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoClient, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useAtom, useSetAtom } from 'jotai';
import { useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { modalState, useContextMenu } from '@/components/ContextMenu';
import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { SpaceIconLike, StyledSpaceIcon } from '@/components/atoms/SpaceIcon';
import { faMikoto } from '@/components/icons';
import { SpaceJoinModal } from '@/components/modals/SpaceJoin';
import { reorder } from '@/functions/reorder';
import { useMikoto } from '@/hooks';
import { treebarSpaceState, workspaceState } from '@/store';
import { ackStore, isSpaceUnread } from '@/store/unreads';

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
  margin-bottom: 2px;
  padding-left: 6px;
  padding-right: 8px;
`;

function useSpaceUnreadState(mikoto: MikotoClient) {
  useSnapshot(ackStore);
  useSnapshot(mikoto.channels.cache);
  return {
    isUnread: (spaceId: string) => isSpaceUnread(mikoto, spaceId),
  };
}

interface SidebarSpaceIconProps {
  space: MikotoSpace;
  unread?: boolean;
}

function SortableSpaceIcon({
  space,
  index,
  unread,
}: SidebarSpaceIconProps & { index: number }) {
  const { ref } = useSortable({
    id: space.id,
    index,
  });

  return (
    <div ref={ref}>
      <SidebarSpaceIcon space={space} unread={unread} />
    </div>
  );
}

function SidebarSpaceIcon({ space, unread }: SidebarSpaceIconProps) {
  const [leftSidebar, setLeftSidebar] = useAtom(treebarSpaceState);
  const isActive =
    leftSidebar &&
    leftSidebar.kind === 'explorer' &&
    leftSidebar.spaceId === space.id;
  const setWorkspace = useSetAtom(workspaceState);

  const contextMenu = useContextMenu(() => <SpaceContextMenu space={space} />);

  return (
    <SpaceIconTooltip tooltip={space.name}>
      <StyledIconWrapper>
        {unread && !isActive && <Pill h={8} />}
        <StyledSpaceIcon
          active={isActive}
          size={ICON_SIZE}
          spaceId={space.id}
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
  const setModal = useSetAtom(modalState);

  return (
    <SpaceIconTooltip tooltip="Add / Join Space">
      <StyledIconWrapper>
        <StyledSpaceIcon
          size={ICON_SIZE}
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

const ICON_SIZE = '40px';

export function SpaceSidebar() {
  const mikoto = useMikoto();
  const [spaceId, setSpaceId] = useAtom(treebarSpaceState);
  const { isUnread } = useSpaceUnreadState(mikoto);

  useSnapshot(mikoto.spaces);
  const contextMenu = useContextMenu(() => <SpaceBackContextMenu />);

  const [order, setOrder] = useState<string[]>(() =>
    // TODO: persist to server
    JSON.parse(localStorage.getItem('spaceOrder') ?? '[]'),
  );
  const [spaceArray, isOrdered] = orderSpaces(mikoto, order);
  if (!isOrdered) {
    setOrder(spaceArray.map((x) => x.id));
    return null;
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        const { source, target } = event.operation;
        if (!source || !target) return;

        const fromIndex = spaceArray.findIndex((s) => s.id === source.id);
        const toIndex = spaceArray.findIndex((s) => s.id === target.id);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

        setOrder((spaceOrders) => {
          const reordered = reorder(spaceOrders, fromIndex, toIndex);
          localStorage.setItem('spaceOrder', JSON.stringify(reordered));
          return reordered;
        });
      }}
    >
      <StyledSpaceSidebar onContextMenu={contextMenu}>
        <StyledIconWrapper
          style={{
            marginTop: '8px',
          }}
        >
          <SpaceIconLike
            style={{
              background:
                spaceId === null
                  ? 'linear-gradient(133deg, #2298ff 0%, rgba(59,108,255,1) 100%)'
                  : 'var(--chakra-colors-gray-700)',
            }}
            onClick={() => {
              setSpaceId(null);
            }}
          >
            <FontAwesomeIcon icon={faMikoto} fontSize="24px" />
          </SpaceIconLike>
        </StyledIconWrapper>
        <Separator
          borderColor="gray.600"
          ml={3}
          width={9}
          borderWidth="1px"
          my={2}
        />

        {spaceArray
          .filter((x) => x.type === 'NONE') // TODO: filter this on the server
          .map((space, index) => (
            <SortableSpaceIcon
              key={space.id}
              space={space}
              index={index}
              unread={isUnread(space.id)}
            />
          ))}
        <JoinSpaceButon />
      </StyledSpaceSidebar>
    </DragDropProvider>
  );
}
