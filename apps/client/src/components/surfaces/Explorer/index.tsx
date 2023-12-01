import { faFile, faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { Channel, ClientChannel, ClientSpace } from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useFetchMember, useMikoto } from '../../../hooks';
import { useTabkit } from '../../../store/surface';
import { ContextMenu, modalState, useContextMenuX } from '../../ContextMenu';
import { ChannelContextMenu, CreateChannelModal } from './ChannelContextMenu';
import { ExplorerNext, NodeObject } from './ExplorerNext';
import { channelToTab, getIconFromChannelType } from './channelToTab';

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
          setModal({ elem: <CreateChannelModal /> });
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

const TreeHead = styled.div`
  padding: 4px 16px;

  h1 {
    padding-top: 8px;
    font-size: 16px;
  }
`;

function channelToStructuredTree(
  channels: ClientChannel[],
  nodeObjectFactory: (ch: ClientChannel) => NodeObject,
): NodeObject {
  const root: NodeObject = {
    id: 'root',
    text: '',
    descendant: [],
  };

  const map = new Map<string, NodeObject>();
  map.set(root.id, root);
  channels.forEach((channel) => {
    const node: NodeObject = nodeObjectFactory(channel);
    map.set(node.id, node);
  });

  channels.forEach((channel) => {
    const node = map.get(channel.id)!;
    if (channel.parentId) {
      const parent = map.get(channel.parentId);
      // bugged
      // how do we know that parent is already defined?
      if (parent) {
        if (parent.descendant === undefined) parent.descendant = [];
        parent.descendant.push(node);
      }
    } else {
      root.descendant!.push(node);
    }
  });
  return root;
}

function isUnread(lastUpdate: Date | null, ack: Date | null) {
  if (lastUpdate === null || ack === null) return false;
  return lastUpdate.getTime() > ack.getTime();
}

export const Explorer = observer(({ space }: { space: ClientSpace }) => {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  useFetchMember(space);

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

  const nodeContextMenu = useContextMenuX();
  const channelTree = channelToStructuredTree(space.channels, (channel) => ({
    icon: getIconFromChannelType(channel.type),
    id: channel.id,
    text: channel.name,
    unread: isUnread(channel.lastUpdatedDate, acks[channel.id] ?? null),
    onClick(ev) {
      tabkit.openTab(channelToTab(channel), ev.ctrlKey);
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
    onContextMenu: nodeContextMenu(() => (
      <ChannelContextMenu channel={channel} />
    )),
  }));

  // TODO: return loading indicator
  if (space === null) return null;

  return (
    <StyledTree
      onContextMenu={nodeContextMenu(<TreebarContextMenu space={space} />)}
    >
      <TreeHead>
        <h1>{space.name}</h1>
      </TreeHead>
      {/* <TreeBanner /> */}
      <ExplorerNext nodes={channelTree.descendant!} />
    </StyledTree>
  );
});
