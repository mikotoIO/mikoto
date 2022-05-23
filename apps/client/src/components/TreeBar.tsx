import styled from 'styled-components';
import React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';

import { Channel } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { useMikoto } from '../api';
import { useSocketIO } from '../hooks/useSocketIO';
import { TabIcon } from './TabIcon';
import { useDelta } from '../hooks';
import { Tabable, treebarSpaceIdState, useTabkit } from '../store';

export const TreeContainer = styled.div`
  margin: 0;
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
`;

const TreeNodeElement = styled.a`
  font-size: 14px;
  height: 20px;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }
`;

interface TreeNodeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  channel: Channel;
}

export function TreeNode({ channel, ...props }: TreeNodeProps) {
  const mikoto = useMikoto();
  const menu = useContextMenu(({ destroy }) => (
    <ContextMenu>
      <ContextMenu.Link
        onClick={async () => {
          destroy();
          await mikoto.deleteChannel(channel.id);
        }}
      >
        Delete Channel
      </ContextMenu.Link>
    </ContextMenu>
  ));

  return (
    <TreeNodeElement {...props} onContextMenu={menu}>
      <TabIcon />
      {channel.name}
    </TreeNodeElement>
  );
}

function CreateChannelModal() {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const spaceId = useRecoilValue(treebarSpaceIdState);
  const form = useForm({
    initialValues: {
      channelName: '',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await mikoto.createChannel(spaceId!, form.values.channelName);
        setModal(null);
        form.reset();
      })}
    >
      <TextInput
        label="Channel Name"
        placeholder="New Channel"
        {...form.getInputProps('channelName')}
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

function channelToTab(channel: Channel): Tabable {
  return {
    kind: 'textChannel',
    key: channel.id,
    name: channel.name,
    channel,
  };
}

export function TreeBar() {
  const spaceId = useRecoilValue(treebarSpaceIdState);
  const tabkit = useTabkit();

  const mikoto = useMikoto();

  const channelDelta = useDelta<Channel>(
    {
      initializer: () => mikoto.getChannels(spaceId!),
      predicate: (x) => x.spaceId === spaceId,
    },
    [spaceId],
  );
  useSocketIO<Channel>(mikoto.io, 'channelCreate', channelDelta.create, [
    spaceId,
  ]);
  useSocketIO<Channel>(mikoto.io, 'channelDelete', channelDelta.delete, [
    spaceId,
  ]);

  const contextMenu = useContextMenu(() => <TreebarContextMenu />);

  return (
    <TreeContainer onContextMenu={contextMenu}>
      {channelDelta.data.map((channel) => (
        <TreeNode
          channel={channel}
          key={channel.id}
          onClick={(ev) => {
            tabkit.openTab(channelToTab(channel), ev.ctrlKey);
          }}
        />
      ))}
    </TreeContainer>
  );
}
