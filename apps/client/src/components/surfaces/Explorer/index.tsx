import { Box, Flex, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { MikotoChannel, MikotoSpace, Relationship } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { useSnapshot } from 'valtio/react';

import {
  ContextMenu,
  modalState,
  useContextMenuX,
} from '@/components/ContextMenu';
import { useFetchMember, useMikoto } from '@/hooks';
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

function TreebarContextMenu({ space }: { space: MikotoSpace }) {
  const setModal = useSetRecoilState(modalState);
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

  // TODO: return loading indicator
  if (space === null) return null;

  return (
    <StyledTree
      onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
    >
      <Box p="16px">
        <Heading fontSize="16px">{space.name}</Heading>
      </Box>
      {/* <TreeBanner /> */}
      <ExplorerInner space={space} />
    </StyledTree>
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
