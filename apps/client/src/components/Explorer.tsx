import { faHashtag, faVolumeLow } from '@fortawesome/free-solid-svg-icons';
import { Button, Select, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { ClientSpace, ClientChannel } from 'mikotojs';
import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useDelta, useDeltaInstance } from '../hooks/useDelta';
import { Tabable, treebarSpaceState, useTabkit } from '../store';
import { ContextMenu, modalState, useContextMenu } from './ContextMenu';
import { IconBox } from './atoms/IconBox';
import { Pill } from './atoms/Pill';

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

function calculateChannelIcon(type: string) {
  switch (type) {
    case 'TEXT':
      return faHashtag;
    case 'VOICE':
      return faVolumeLow;
    default:
      return faHashtag;
  }
}

function channelToTab(channel: ClientChannel): Tabable {
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

export function ChannelNode({
  channel,
  onReorder,
  unread,
  ...props
}: ChanelNodeProps) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const menu = useContextMenu(({ destroy }) => (
    <ContextMenu>
      <ContextMenu.Link>Open in new tab</ContextMenu.Link>
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'voiceChannel',
              channel,
              key: 'voice',
            },
            false,
          );
        }}
      >
        Start Voice Call
      </ContextMenu.Link>
      <ContextMenu.Link>Mark as Read</ContextMenu.Link>
      <ContextMenu.Link
        onClick={async () => {
          destroy();
          await channel.delete();
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

  const isUnread = false;

  return (
    <StyledChannelNode
      {...props}
      onClick={(ev) => {
        tabkit.openTab(channelToTab(channel), ev.ctrlKey);
      }}
      unread={isUnread}
      onContextMenu={menu}
      ref={ref}
    >
      {isUnread && <Pill />}
      <IconBox icon={calculateChannelIcon(channel.type)} />
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
      name: '',
      type: 'TEXT',
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async () => {
        await space!.createChannel(form.values.name, form.values.type);
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

export function Explorer({ space }: { space: ClientSpace }) {
  const channelDelta = useDelta(space.channels, [space?.id!]);

  // const mikoto = useMikoto();
  // useEffect(() => {
  //   mikoto.getRoles(space.id).then((x) => console.log(x));
  // }, [space?.id!]);
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
            onReorder={async () => {
              await channelDelta.refetch();
            }}
          />
        ))}
      </StyledTreeBody>
    </StyledTree>
  );
}
