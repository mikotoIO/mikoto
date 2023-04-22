import { Button, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Channel, ClientSpace } from 'mikotojs';
import React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useDeltaNext } from '../hooks/useDelta';
import { Tabable, treebarSpaceState, useTabkit } from '../store';
import { ContextMenu, modalState, useContextMenuX } from './ContextMenu';
import { ExplorerNext, NodeObject } from './ExplorerNext';

const StyledTree = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

function channelToTab(channel: Channel): Tabable {
  switch (channel.type) {
    case 'TEXT':
      return {
        kind: 'textChannel',
        key: channel.id,
        channel,
      };
    case 'VOICE':
      return {
        kind: 'voiceChannel',
        key: channel.id,
        channel,
      };
    default:
      throw new Error('Unknown channel type');
  }
}

function CreateChannelModal() {
  const mikoto = useMikoto();
  // const setModal = useSetRecoilState(modalState);
  const space = useRecoilValue(treebarSpaceState);
  const form = useForm({
    initialValues: {
      name: '',
      type: 'TEXT',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await mikoto.client.channels.create(space!.id, {
          name: form.values.name,
          type: form.values.type,
        });
      })}
    >
      <Select
        label="Channel Type"
        data={[
          { label: 'Text Channel', value: 'TEXT' },
          { label: 'Voice Channel', value: 'VOICE' },
        ]}
        {...form.getInputProps('type')}
      />
      <TextInput
        label="Channel Name"
        placeholder="New Channel"
        {...form.getInputProps('name')}
      />
      <Button mt={16} fullWidth type="submit">
        Create Channel
      </Button>
    </form>
  );
}

function TreebarContextMenu() {
  const setModal = useSetRecoilState(modalState);
  return (
    <ContextMenu>
      <ContextMenu.Link
        onClick={() => {
          setModal({ title: 'Create Channel', elem: <CreateChannelModal /> });
        }}
      >
        Create Channel
      </ContextMenu.Link>
      <ContextMenu.Link>Invite People</ContextMenu.Link>
    </ContextMenu>
  );
}

const TreeHead = styled.div`
  padding: 4px 16px;
  background-color: ${(p) => p.theme.colors.N1000};

  h1 {
    font-size: 16px;
  }
`;

function channelToStructuredTree(
  channels: Channel[],
  options: {
    onClickFactory(ch: Channel): (ev: React.MouseEvent) => void;
    onContextMenuFactory(ch: Channel): (ev: React.MouseEvent) => void;
  },
): NodeObject {
  const root: NodeObject = {
    id: 'root',
    text: '',
    descendant: [],
  };

  const map = new Map<string, NodeObject>();
  map.set(root.id, root);

  channels.forEach(channel => {
    const node: NodeObject = {
      id: channel.id,
      text: channel.name,
      onClick: options.onClickFactory(channel),
      onContextMenu: options.onContextMenuFactory(channel),
    };
    map.set(node.id, node);

    if (channel.parentId) {
      const parent = map.get(channel.parentId);
      if (parent) {
        if (parent.descendant === undefined) parent.descendant = [];
        parent.descendant.push(node);
      }
    } else {
      root.descendant!.push(node);
    }
  })

  return root;
}

export function Explorer({ space }: { space: ClientSpace }) {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const channelDelta = useDeltaNext<Channel>(
    mikoto.channelEmitter,
    space.id,
    async () => await mikoto.client.channels.list(space.id),
    [space.id!],
  );
  // const channelDelta = useDelta(space.channels, [space?.id!]);
  const nodeContextMenu = useContextMenuX();
  const channels = [...channelDelta.data].sort((a, b) => a.order - b.order);
  const channelTree = channelToStructuredTree(channels, {
    onClickFactory(ch) {
      return (ev) => {
        tabkit.openTab(channelToTab(ch), ev.ctrlKey);
      };
    },
    onContextMenuFactory(channel) {
      return nodeContextMenu(
        <ContextMenu>
          <ContextMenu.Link>Open in new tab</ContextMenu.Link>
          <ContextMenu.Link>Mark as Read</ContextMenu.Link>
          <ContextMenu.Link
            onClick={async () => {
              await mikoto.channel(channel).delete();
            }}
          >
            Delete Channel
          </ContextMenu.Link>
        </ContextMenu>,
      );
    },
  });

  return (
    <StyledTree onContextMenu={nodeContextMenu(<TreebarContextMenu />)}>
      <TreeHead>
        <h1>{space.name}</h1>
      </TreeHead>
      <ExplorerNext nodes={channelTree.descendant!} />
    </StyledTree>
  );
}
