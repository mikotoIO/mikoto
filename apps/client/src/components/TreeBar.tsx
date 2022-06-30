import styled from 'styled-components';
import React from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';

import { Channel } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { ClientChannel, ClientSpace, useMikoto } from '../api';
import { TabIcon } from './TabIcon';
import { Tabable, treebarSpaceState, useTabkit } from '../store';
import { useDelta } from '../hooks/useDelta';

const TreeContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

export const TreeBody = styled.div`
  margin: 0;
  padding: 10px;
  min-height: min-content;
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

const TreeHead = styled.div`
  padding: 4px 16px;
  background-color: ${(p) => p.theme.colors.N1000};

  h1 {
    font-size: 16px;
  }
`;

export function TreeBar({ space }: { space: ClientSpace }) {
  const tabkit = useTabkit();

  const channelDelta = useDelta(space.channels, [space?.id!]);
  const contextMenu = useContextMenu(() => <TreebarContextMenu />);

  return (
    <TreeContainer>
      <TreeHead>
        <h1>{space.name}</h1>
      </TreeHead>
      <TreeBody onContextMenu={contextMenu}>
        {channelDelta.data.map((channel) => (
          <TreeNode
            channel={channel}
            key={channel.id}
            onClick={(ev) => {
              tabkit.openTab(channelToTab(channel), ev.ctrlKey);
            }}
          />
        ))}
      </TreeBody>
    </TreeContainer>
  );
}
