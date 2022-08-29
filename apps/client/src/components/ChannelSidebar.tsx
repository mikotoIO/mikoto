import styled from 'styled-components';
import React, { useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useForm } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';

import { useDrag, useDrop } from 'react-dnd';
import { Channel } from '../models';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { useMikoto } from '../api';
import { IconBox } from './atoms/IconBox';
import { Tabable, treebarSpaceState, useTabkit } from '../store';
import { useDelta, useDeltaInstance } from '../hooks/useDelta';
import { Pill } from './atoms/Pill';
import { ClientSpace } from '../api/entities/ClientSpace';
import { ClientChannel } from '../api/entities/ClientChannel';

const StyledTree = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

export const StyledTreeBody = styled.div`
  margin: 0;
  padding: 10px;
  min-height: min-content;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
`;

const StyledChannelNode = styled.a<{ unread?: boolean }>`
  position: relative;
  font-size: 14px;
  height: 20px;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-weight: ${(p) => (p.unread ? '600' : 'inherit')};
  color: ${(p) => (p.unread ? 'white' : 'rgba(255, 255, 255, 0.8)')};
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: ${(p) => p.theme.colors.N700};
  }
`;

interface ChanelNodeProps extends React.HTMLAttributes<HTMLAnchorElement> {
  channel: ClientChannel;
  unread?: Date;
  onReorder?(): void;
}

export function ChannelNode({
  channel,
  onReorder,
  unread,
  ...props
}: ChanelNodeProps) {
  const mikoto = useMikoto();
  const menu = useContextMenu(({ destroy }) => (
    <ContextMenu>
      <ContextMenu.Link>Mark as Read</ContextMenu.Link>
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
  const instance = useDeltaInstance(channel.instance, [channel.id]);

  const ref = useRef<HTMLAnchorElement>(null);
  const [, drag] = useDrag<ClientChannel>({
    type: 'CHANNEL',
    item: channel,
  });
  const [, drop] = useDrop<ClientChannel>({
    accept: 'CHANNEL',
    async drop(item) {
      await mikoto.moveChannel(item.id, channel.order);
      console.log(`channel: ${item.name}, target: ${channel.order}`);
      onReorder?.();
    },
  });

  drag(drop(ref));

  const isUnread =
    instance.data === null
      ? false
      : unread === undefined || unread < new Date(instance.data.lastUpdated);

  return (
    <StyledChannelNode
      {...props}
      unread={isUnread}
      onContextMenu={menu}
      ref={ref}
    >
      {isUnread && <Pill />}
      <IconBox />
      {channel.name}
    </StyledChannelNode>
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

export function ChannelSidebar({ space }: { space: ClientSpace }) {
  const tabkit = useTabkit();

  const channelDelta = useDelta(space.channels, [space?.id!]);
  const contextMenu = useContextMenu(() => <TreebarContextMenu />);

  const channels = [...channelDelta.data].sort((a, b) => a.order - b.order);
  const unreadDelta = useDeltaInstance(space.unreads, [space.id]);
  const unreadInstance = unreadDelta.data || {};

  return (
    <StyledTree>
      <TreeHead>
        <h1>{space.name}</h1>
      </TreeHead>
      <StyledTreeBody onContextMenu={contextMenu}>
        {channels.map((channel) => (
          <ChannelNode
            unread={unreadInstance[channel.id]}
            channel={channel}
            key={channel.id}
            onClick={(ev) => {
              tabkit.openTab(channelToTab(channel), ev.ctrlKey);
            }}
            onReorder={async () => {
              await channelDelta.refetch();
            }}
          />
        ))}
      </StyledTreeBody>
    </StyledTree>
  );
}
