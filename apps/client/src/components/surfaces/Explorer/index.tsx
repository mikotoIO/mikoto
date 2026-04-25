import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faChevronDown,
  faChevronRight,
  faGlobe,
  faMagnifyingGlass,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoChannel, MikotoSpace } from '@mikoto-io/mikoto.js';
import { useAtom, useSetAtom } from 'jotai';
import { NumberSize, Resizable } from 're-resizable';
import { useSnapshot } from 'valtio/react';

import {
  ContextMenu,
  modalState,
  useContextMenuX,
} from '@/components/ContextMenu';
import { RESIZABLE_DISABLES } from '@/components/sidebars/Base';
import { MemberListSidebar } from '@/components/sidebars/MemberListSidebar';
import { useFetchMember, useMikoto } from '@/hooks';
import { explorerPanelsState } from '@/store';
import { useTabkit } from '@/store/surface';
import { ackChannel, ackStore, isChannelUnread } from '@/store/unreads';

import { ChannelContextMenu, CreateChannelModal } from './ChannelContextMenu';
import { ChannelTree } from './ChannelTree';
import { channelToTab, getIconFromChannelType } from './channelToTab';
import { channelToStructuredTree } from './explorerNode';

const StyledTree = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
`;

const ExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const PanelHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  flex-shrink: 0;
  padding: 0 12px;
  background: var(--chakra-colors-gray-800);
  border: none;
  border-top: 1px solid var(--chakra-colors-gray-700);
  color: var(--chakra-colors-gray-300);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  user-select: none;
  font-family: var(--font-heading);

  &:hover {
    background: var(--chakra-colors-gray-750);
  }

  .chevron {
    font-size: 9px;
    transition: transform 0.15s ease;
  }
`;

const PanelContent = styled.div`
  overflow: hidden;
  min-height: 0;
`;

export function TreebarContextMenu({ space }: { space: MikotoSpace }) {
  const setModal = useSetAtom(modalState);
  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({ elem: <CreateChannelModal space={space} /> });
        }}
      >
        Create Channel
      </ContextMenu.Link>
      <ContextMenu.Link>Invite People</ContextMenu.Link>
    </ContextMenu>
  );
}

function useAcks() {
  useSnapshot(ackStore);

  return {
    isChannelUnread(channel: MikotoChannel) {
      return isChannelUnread(channel.lastUpdated, channel.id);
    },
    ackChannel(channel: MikotoChannel) {
      const now = new Date().toISOString();
      channel.ack().then(() => {
        ackChannel(channel.id, now);
      });
    },
  };
}

function ExplorerInner({ space }: { space: MikotoSpace }) {
  useFetchMember(space);
  const tabkit = useTabkit();
  const { isChannelUnread: isUnread, ackChannel } = useAcks();
  const nodeContextMenu = useContextMenuX();

  useSnapshot(space);
  useSnapshot(space.channels); // TODO: fine-grained subscription

  const channelTree = channelToStructuredTree(space.channels, (channel) => ({
    icon: getIconFromChannelType(channel.type),
    id: channel.id,
    text: channel.name,
    unread: isUnread(channel),
    onClick(ev) {
      const tab = channelToTab(channel);

      // Always open in a new tab if Ctrl is pressed or if there are already tabs
      const forceNewTab = ev.ctrlKey || tabkit.getTabs().length > 0;

      tabkit.openTab(tab, forceNewTab);
      ackChannel(channel);
    },
    onContextMenu: nodeContextMenu(() => (
      <ChannelContextMenu channel={channel} />
    )),
    onDragStart(ev) {
      const tab = channelToTab(channel);
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('application/mikoto-tab', JSON.stringify(tab));
      ev.dataTransfer.setData('text/plain', channel.name);
    },
  }));

  return <ChannelTree nodes={channelTree.descendant ?? []} />;
}

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0 0 8px;
  padding: 6px 12px;
  background: var(--chakra-colors-gray-800);
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--chakra-colors-gray-400);
  font-size: 13px;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--chakra-colors-gray-700);
    color: var(--chakra-colors-gray-200);
  }
`;

export function Explorer({ space }: { space: MikotoSpace }) {
  const nodeContextMenu = useContextMenuX();
  const [panels, setPanels] = useAtom(explorerPanelsState);
  const tabkit = useTabkit();

  const channelHeaderContextMenu = useContextMenuX();

  // TODO: return loading indicator
  if (space === null) return null;

  return (
    <ExplorerContainer>
      <Box p="16px" flexShrink={0}>
        <Heading fontSize="16px" mb={0}>
          {space.name}
        </Heading>
        {space.visibility === 'PUBLIC' && (
          <Flex
            alignItems="center"
            gap={1}
            fontSize="12px"
            color="gray.400"
            mt="2px"
          >
            <FontAwesomeIcon icon={faGlobe} />
            {space.memberCount} Members
          </Flex>
        )}
        <SearchButton
          onClick={() =>
            tabkit.openTab(
              {
                kind: 'search',
                key: `search:${space.id}`,
                spaceId: space.id,
              },
              false,
            )
          }
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} fixedWidth />
          <span>Search</span>
        </SearchButton>
      </Box>

      <PanelHeader
        onClick={() =>
          setPanels((p) => ({
            ...p,
            channelsCollapsed: !p.channelsCollapsed,
          }))
        }
        onContextMenu={channelHeaderContextMenu(
          <TreebarContextMenu space={space} />,
        )}
      >
        <FontAwesomeIcon
          className="chevron"
          icon={panels.channelsCollapsed ? faChevronRight : faChevronDown}
        />
        Channels
        <FontAwesomeIcon
          icon={faPlus}
          style={{
            marginLeft: 'auto',
            marginRight: '8px',
            fontSize: '12px',
            opacity: 0.6,
          }}
          onClick={(ev) => {
            ev.stopPropagation();
            channelHeaderContextMenu(<TreebarContextMenu space={space} />)(ev);
          }}
        />
      </PanelHeader>

      {panels.channelsCollapsed ? null : (
        <Resizable
          enable={{ ...RESIZABLE_DISABLES, bottom: true }}
          size={{ width: '100%', height: panels.channelsHeight }}
          minHeight={60}
          onResizeStop={(
            _e: unknown,
            _dir: unknown,
            _ref: unknown,
            d: NumberSize,
          ) => {
            setPanels((p) => ({
              ...p,
              channelsHeight: p.channelsHeight + d.height,
            }));
          }}
          handleStyles={{
            bottom: {
              height: 4,
              bottom: 0,
              cursor: 'row-resize',
            },
          }}
        >
          <StyledTree
            onContextMenu={nodeContextMenu(
              <TreebarContextMenu space={space} />,
            )}
          >
            <ExplorerInner space={space} />
          </StyledTree>
        </Resizable>
      )}

      <PanelHeader
        onClick={() =>
          setPanels((p) => ({
            ...p,
            membersCollapsed: !p.membersCollapsed,
          }))
        }
      >
        <FontAwesomeIcon
          className="chevron"
          icon={panels.membersCollapsed ? faChevronRight : faChevronDown}
        />
        Members
      </PanelHeader>

      {panels.membersCollapsed ? null : (
        <PanelContent style={{ flex: 1 }}>
          <MemberListSidebar space={space} />
        </PanelContent>
      )}
    </ExplorerContainer>
  );
}

export function ExplorerSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const space = mikoto.spaces._get(spaceId);
  if (space === undefined) return null;
  return <Explorer space={space} />;
}
