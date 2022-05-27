import styled from 'styled-components';
import React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';

import { Channel } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { ClientChannel, ClientSpace, useMikoto } from '../api';
import { TabIcon } from './TabIcon';
import { useDeltaEngine } from '../hooks';
import { Tabable, treebarSpaceState, useTabkit } from '../store';

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
  const space = useRecoilValue(treebarSpaceState);
  const form = useForm({
    initialValues: {
      channelName: '',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await mikoto.createChannel(space?.id!, form.values.channelName);
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
    channel: channel instanceof ClientChannel ? channel.simplify() : channel,
  };
}

export function TreeBar() {
  const space = useRecoilValue(treebarSpaceState);
  const tabkit = useTabkit();
  const mikoto = useMikoto();

  const mSpace = new ClientSpace(mikoto, space!);

  const channelDelta = useDeltaEngine(mSpace.channels, [space?.id!]);

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
