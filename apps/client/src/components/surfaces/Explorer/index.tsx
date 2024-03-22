import { Box, Flex, Heading } from '@chakra-ui/react';
import { ClientChannel, ClientRelation, ClientSpace } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from '@emotion/styled';

import { useFetchMember, useMikoto } from '../../../hooks';
import { useTabkit } from '../../../store/surface';
import { ContextMenu, modalState, useContextMenuX } from '../../ContextMenu';
import { Avatar } from '../../atoms/Avatar';
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

function TreebarContextMenu({ space }: { space: ClientSpace }) {
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

function isUnread(lastUpdate: Date | null, ack: Date | null) {
  if (lastUpdate === null || ack === null) return false;
  return lastUpdate.getTime() > ack.getTime();
}

function useAcks(space: ClientSpace) {
  const mikoto = useMikoto();
  const [acks, setAcks] = useState<Record<string, Date>>({});

  useEffect(() => {
    mikoto.client.messages.listUnread({ spaceId: space.id }).then((ur) => {
      setAcks(
        Object.fromEntries(ur.map((u) => [u.channelId, new Date(u.timestamp)])),
      );
    });
  }, [space.id]);

  useEffect(() => {
    const destroy = mikoto.client.messages.onCreate((msg) => {
      const ch = mikoto.channels.get(msg.channelId);
      if (ch?.spaceId !== space.id) return;
      if (msg.author?.id === mikoto.me.id) return;

      ch.lastUpdated = msg.timestamp;
    });
    return () => {
      destroy();
    };
  }, [space.id]);

  return {
    acks,
    ackChannel(channel: ClientChannel) {
      const now = new Date();
      mikoto.client.messages
        .ack({
          channelId: channel.id,
          timestamp: now.toISOString(),
        })
        .then(() => {
          setAcks((xs) => ({ ...xs, [channel.id]: now }));
        });
    },
  };
}

const ExplorerInner = observer(({ space }: { space: ClientSpace }) => {
  useFetchMember(space);
  const tabkit = useTabkit();
  const { acks, ackChannel } = useAcks(space);
  const nodeContextMenu = useContextMenuX();

  const channelTree = channelToStructuredTree(space.channels, (channel) => ({
    icon: getIconFromChannelType(channel.type),
    id: channel.id,
    text: channel.name,
    unread: isUnread(channel.lastUpdatedDate, acks[channel.id] ?? null),
    onClick(ev) {
      tabkit.openTab(channelToTab(channel), ev.ctrlKey);
      ackChannel(channel);
    },
    onContextMenu: nodeContextMenu(() => (
      <ChannelContextMenu channel={channel} />
    )),
  }));

  return <ChannelTree nodes={channelTree.descendant ?? []} />;
});

export const Explorer = observer(({ space }: { space: ClientSpace }) => {
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
});

export const DMExplorer = observer(
  ({ space, relation }: { space: ClientSpace; relation: ClientRelation }) => {
    const nodeContextMenu = useContextMenuX();

    // TODO: return loading indicator
    if (space === null) return null;

    return (
      <StyledTree
        onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
      >
        <Flex p="16px" align="center">
          <Avatar src={relation.relation?.avatar ?? undefined} size={32} />
          <Heading fontSize="16px" ml={2}>
            {relation.relation?.name ?? 'Unknown User'}
          </Heading>
        </Flex>
        <ExplorerInner space={space} />
      </StyledTree>
    );
  },
);

export function ExplorerSurface({ spaceId }: { spaceId: string }) {
  const mikoto = useMikoto();
  const space = mikoto.spaces.get(spaceId);
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
  const space = mikoto.spaces.get(spaceId);
  const relation = mikoto.relations.get(relationId);

  if (space === undefined || relation === undefined) return null;
  return <DMExplorer space={space} relation={relation} />;
}
