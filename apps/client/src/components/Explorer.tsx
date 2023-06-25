import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import { Button, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Channel, Space } from 'mikotojs';
import React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useDeltaNext } from '../hooks/useDelta';
import { DialogPanel } from '../lucid/DialogPanel';
import { Input } from '../lucid/Input';
import { Tabable, treebarSpaceState, useTabkit } from '../store';
import { ContextMenu, modalState, useContextMenuX } from './ContextMenu';
import { ExplorerNext, NodeObject } from './ExplorerNext';

const StyledTree = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
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

const CreateChannelWrapper = styled.div`
  min-width: 400px;

  h1 {
    margin: 0;
  }

  .subchannelinfo {
    color: ${(p) => p.theme.colors.N300};
    margin: 0;
    font-size: 14px;
  }

  form {
    margin-top: 16px;
  }
`;

function CreateChannelModal({ channel }: { channel?: Channel }) {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const space = useRecoilValue(treebarSpaceState);
  const form = useForm({
    initialValues: {
      name: '',
      type: 'TEXT',
    },
  });

  return (
    <DialogPanel>
      <CreateChannelWrapper>
        <h1 style={{ margin: 0 }}>Create Channel</h1>
        {channel && <p className="subchannelinfo">In #{channel.name}</p>}
        <form
          onSubmit={form.onSubmit(async () => {
            await mikoto.client.channels.create(space!.id, {
              name: form.values.name,
              type: form.values.type,
              parentId: channel?.id ?? null,
            });
            setModal(null);
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
          <Input
            labelName="Channel Name"
            placeholder="New Channel"
            {...form.getInputProps('name')}
          />
          <Button mt={16} fullWidth type="submit">
            Create Channel
          </Button>
        </form>
      </CreateChannelWrapper>
    </DialogPanel>
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

function getIconFromChannelType(type: Channel['type']) {
  switch (type) {
    case 'VOICE':
      return faMicrophone;
    default:
      return undefined;
  }
}

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

  channels.forEach((channel) => {
    const node: NodeObject = {
      icon: getIconFromChannelType(channel.type),
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
  });

  return root;
}

export function Explorer({ space }: { space: Space }) {
  const tabkit = useTabkit();
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);

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
          <ContextMenu.Link
            onClick={() => {
              tabkit.openTab(channelToTab(channel), true);
            }}
          >
            Open in new tab
          </ContextMenu.Link>
          <ContextMenu.Link>Mark as Read</ContextMenu.Link>
          <ContextMenu.Link
            onClick={() => {
              setModal({
                title: `Create Subchannel for #${channel.name}`,
                elem: <CreateChannelModal channel={channel} />,
              });
            }}
          >
            Create Subchannel
          </ContextMenu.Link>
          <ContextMenu.Link
            onClick={async () => {
              await mikoto.client.channels.delete(channel.id);
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
