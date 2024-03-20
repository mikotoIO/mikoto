import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Tippy from '@tippyjs/react';
import { ClientSpace, SpaceStore } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { treebarSpaceState, workspaceState } from '../store';
import { useTabkit } from '../store/surface';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { normalizeMediaUrl } from './atoms/Avatar';
import { Pill } from './atoms/Pill';
import { StyledSpaceIcon } from './atoms/SpaceIcon';
import { Tooltip } from './atoms/Tooltip';
import { faMikoto } from './icons/faMikoto';
import { InviteModal } from './modals/Invite';
import { SpaceJoinModal } from './modals/SpaceJoin';

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

function ServerIconContextMenu({ space }: { space: ClientSpace }) {
  const tabkit = useTabkit();
  const setModal = useSetRecoilState(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () =>
          tabkit.openTab(
            {
              kind: 'spaceSettings',
              key: space.id,
              spaceId: space.id,
            },
            true,
          )
        }
      >
        Space Settings
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => await navigator.clipboard.writeText(space.id)}
      >
        Copy ID
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <InviteModal space={space} />,
          });
        }}
      >
        Generate Invite
      </ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => {
          await space.leave();
        }}
      >
        Leave Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

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
  space: ClientSpace;
  index: number;
  onReorder?: (from: number, to: number) => void;
}

interface SpaceIconDragItem {
  spaceId: string;
  index: number;
}

function SpaceIconTooltip({
  children,
  tooltip,
}: {
  children: React.ReactElement;
  tooltip: string;
}) {
  return (
    <Tippy
      animation={false}
      content={<Tooltip>{tooltip}</Tooltip>}
      placement="right"
      offset={[0, 0]}
    >
      {children}
    </Tippy>
  );
}

function SidebarSpaceIcon({ space, index, onReorder }: SidebarSpaceIconProps) {
  // TF is this name?
  const [leftSidebar, setLeftSidebar] = useRecoilState(treebarSpaceState);
  const isActive =
    leftSidebar &&
    leftSidebar.kind === 'explorer' &&
    leftSidebar.spaceId === space.id;
  const setWorkspace = useSetRecoilState(workspaceState);

  const [, drag] = useDrag(
    () => ({
      type: 'SPACE',
      item: { spaceId: space.id, index },
    }),
    [space.id, index],
  );
  const [, drop] = useDrop({
    accept: 'SPACE',
    drop: (item: SpaceIconDragItem) => {
      onReorder?.(item.index, index);
    },
  });

  const ref = useRef<HTMLDivElement>(null);
  drag(drop(ref));
  const contextMenu = useContextMenu(() => (
    <ServerIconContextMenu space={space} />
  ));

  return (
    <SpaceIconTooltip tooltip={space.name}>
      <StyledIconWrapper ref={ref}>
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
            space.fetchMembers().then();
          }}
        >
          {space.icon === null ? space.name[0] : ''}
        </StyledSpaceIcon>
      </StyledIconWrapper>
    </SpaceIconTooltip>
  );
}

function ServerSidebarContextMenu() {
  const setModal = useSetRecoilState(modalState);

  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({
            elem: <SpaceJoinModal />,
          });
        }}
      >
        Create / Join Space
      </ContextMenu.Link>
    </ContextMenu>
  );
}

const Seperator = styled.hr`
  border-width: 1px;
  width: 28px;
  border-color: var(--N500);
`;

// order spaces in the same order as the array of IDs
// if an ID is not in the array, put it at the end
function orderSpaces(spaces: SpaceStore, order: string[]) {
  const ordered: ClientSpace[] = [];
  const unordered: ClientSpace[] = [];
  const keys = new Set(spaces.keys());
  order.forEach((id) => {
    const space = spaces.get(id);
    if (space && space.type === 'NONE') {
      ordered.push(space);
    }
    keys.delete(id);
  });

  keys.forEach((id) => {
    const space = spaces.get(id);
    if (space && space.type === 'NONE') {
      unordered.push(space);
    }
  });
  const res = [...ordered, ...unordered];
  return [res, unordered.length === 0] as const;
}

function reorder<T>(arr: T[], from: number, to: number) {
  if (from === to) return arr;

  const newArr = [...arr];
  const [removed] = newArr.splice(from, 1);
  newArr.splice(to, 0, removed);
  return newArr;
}

export const SpaceSidebar = observer(({ spaces }: { spaces: SpaceStore }) => {
  const setModal = useSetRecoilState(modalState);
  const [spaceId, setSpaceId] = useRecoilState(treebarSpaceState);

  const contextMenu = useContextMenu(() => <ServerSidebarContextMenu />);

  const [order, setOrder] = useState<string[]>(() =>
    // TODO: persist to server
    JSON.parse(localStorage.getItem('spaceOrder') ?? '[]'),
  );
  const [spaceArray, isOrdered] = orderSpaces(spaces, order);
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
            background:
              spaceId === null
                ? 'linear-gradient(133deg, #2298ff 0%, rgba(59,108,255,1) 100%)'
                : undefined,
          }}
          onClick={() => {
            setSpaceId(null);
          }}
        >
          <FontAwesomeIcon icon={faMikoto} fontSize="28px" />
        </StyledSpaceIcon>
      </StyledIconWrapper>
      <Seperator />

      {spaceArray
        .filter((x) => x.type === 'NONE') // TODO: filter this on the server
        .map((space, index) => (
          <SidebarSpaceIcon
            space={space}
            index={index}
            key={space.id}
            onReorder={(from, to) => {
              setOrder((x) => {
                const reordered = reorder(x, from, to);
                localStorage.setItem('spaceOrder', JSON.stringify(reordered));
                return reordered;
              });
            }}
          />
        ))}
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
    </StyledSpaceSidebar>
  );
});
