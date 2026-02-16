import { Box, Flex, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoChannel, MikotoSpace, Relationship } from '@mikoto-io/mikoto.js';
import { useAtom, useSetAtom } from 'jotai';
import { NumberSize, Resizable } from 're-resizable';
import { useEffect, useState } from 'react';
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

function TreebarContextMenu({ space }: { space: MikotoSpace }) {
  const setModal = useSetAtom(modalState);
  const tabkit = useTabkit();
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
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'search',
              key: 'search',
              spaceId: space.id,
            },
            true,
          );
        }}
      >
        Search
      </ContextMenu.Link>
    </ContextMenu>
  );
}

function isUnread(lastUpdate: Date | undefined, ack: Date | null) {
  if (lastUpdate === undefined || ack === null) return false;
  return lastUpdate.getTime() > ack.getTime();
}

function useAcks(space: MikotoSpace) {
  const [acks, setAcks] = useState<Record<string, Date>>({});

  useEffect(() => {
    space.listUnread().then((ur) => {
      setAcks(
        Object.fromEntries(ur.map((u) => [u.channelId, new Date(u.timestamp)])),
      );
    });
  }, [space.id]);

  useEffect(() => {
    // FIXME: what the hell is this
    // const destroy = mikoto.client.messages.onCreate((msg) => {
    //   const ch = mikoto.channels.get(msg.channelId);
    //   if (ch?.spaceId !== space.id) return;
    //   if (msg.author?.id === mikoto.me.id) return;
    //   ch.lastUpdated = msg.timestamp;
    // });
    // return () => {
    //   destroy();
    // };
  }, [space.id]);

  return {
    acks,
    ackChannel(channel: MikotoChannel) {
      const now = new Date();
      channel.ack().then(() => {
        setAcks((xs) => ({ ...xs, [channel.id]: now }));
      });
    },
  };
}

function ExplorerInner({ space }: { space: MikotoSpace }) {
  useFetchMember(space);
  const tabkit = useTabkit();
  const { acks, ackChannel } = useAcks(space);
  const nodeContextMenu = useContextMenuX();

  useSnapshot(space);
  useSnapshot(space.channels); // TODO: fine-grained subscription

  const channelTree = channelToStructuredTree(space.channels, (channel) => ({
    icon: getIconFromChannelType(channel.type),
    id: channel.id,
    text: channel.name,
    unread: isUnread(channel.lastUpdatedDate, acks[channel.id] ?? null),
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
  }));

  return <ChannelTree nodes={channelTree.descendant ?? []} />;
}

export function Explorer({ space }: { space: MikotoSpace }) {
  const nodeContextMenu = useContextMenuX();
  const [panels, setPanels] = useAtom(explorerPanelsState);

  // TODO: return loading indicator
  if (space === null) return null;

  return (
    <ExplorerContainer>
      <Box p="16px" flexShrink={0}>
        <Heading fontSize="16px">{space.name}</Heading>
      </Box>

      <PanelHeader
        onClick={() =>
          setPanels((p) => ({
            ...p,
            channelsCollapsed: !p.channelsCollapsed,
          }))
        }
      >
        <FontAwesomeIcon
          className="chevron"
          icon={panels.channelsCollapsed ? faChevronRight : faChevronDown}
        />
        Channels
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

export const DMExplorer = ({
  space,
}: {
  space: MikotoSpace;
  relation: Relationship;
}) => {
  const nodeContextMenu = useContextMenuX();

  // TODO: return loading indicator
  if (space === null) return null;
  // FIXME: reimplement this
  return (
    <StyledTree
      onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
    >
      <Flex p="16px" align="center">
        {/* <Avatar src={relation.relation?.avatar ?? undefined} size={32} />
        <Heading fontSize="16px" ml={2}>
          {relation.relation?.name ?? 'Unknown User'}
        </Heading> */}
      </Flex>
      <ExplorerInner space={space} />
    </StyledTree>
  );
};

export function ExplorerSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const space = mikoto.spaces._get(spaceId);
  if (space === undefined) return null;
  return <Explorer space={space} />;
}

export function DMExplorerSurface({
  spaceId,
  relationId,
}: {
  spaceId: string;
  relationId: string;
}) {
  const mikoto = useMikoto();
  const space = mikoto.spaces._get(spaceId);
  const relation = mikoto.relationships._get(relationId);

  if (space === undefined || relation === undefined) return null;
  return <DMExplorer space={space} relation={relation} />;
}
