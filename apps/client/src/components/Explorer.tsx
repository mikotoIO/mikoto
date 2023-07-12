import {
  faFileAlt,
  faHashtag,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Channel, Space } from 'mikotojs';
import React from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useDeltaNext } from '../hooks/useDelta';
import { useErrorElement } from '../hooks/useErrorElement';
import { Button } from '../lucid/Button';
import { DialogPanel } from '../lucid/DialogPanel';
import { Form } from '../lucid/Form';
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

  .subchannelinfo {
    color: var(--N300);
    margin: 0;
    font-size: 14px;
  }

  form {
    margin-top: 16px;
  }
`;

const ChannelTypeButton = styled.button<{ active?: boolean }>`
  background-color: ${(p) => p.theme.colors.N900};
  border: 2px solid
    ${(p) => (p.active ? p.theme.colors.B700 : p.theme.colors.N600)};
  color: ${(p) => p.theme.colors.N100};
  font-size: 16px;
  border-radius: 8px;
  min-width: 100px;
  min-height: 100px;
  margin: 8px;
  cursor: pointer;

  .icon {
    margin-bottom: 8px;
    font-size: 24px;
    color: ${(p) => p.theme.colors.N400};
  }

  transition: border-color 0.1s ease-in-out;
`;

const channelTypes = [
  { id: 'TEXT', name: 'Text', icon: faHashtag },
  { id: 'VOICE', name: 'Voice', icon: faMicrophone },
  { id: 'DOCS', name: 'Docs', icon: faFileAlt },
];

function CreateChannelModal({ channel }: { channel?: Channel }) {
  const mikoto = useMikoto();
  const setModal = useSetRecoilState(modalState);
  const space = useRecoilValue(treebarSpaceState);
  const { register, handleSubmit } = useForm();

  const [channelType, setChannelType] = React.useState('TEXT');
  const error = useErrorElement();

  return (
    <DialogPanel>
      <CreateChannelWrapper>
        <h1 style={{ margin: 0 }}>
          {channel ? 'Create Subchannel' : 'Create Channel'}
        </h1>
        {channel && <p className="subchannelinfo">In #{channel.name}</p>}
        <Form
          onSubmit={handleSubmit(async (formData) => {
            try {
              await mikoto.client.channels.create(space!.id, {
                name: formData.name,
                type: channelType,
                parentId: channel?.id ?? null,
              });
              setModal(null);
            } catch (e) {
              console.log(e);
              error.setError((e as any)?.response?.data);
            }
          })}
        >
          {error.el}
          <div>
            {channelTypes.map((type) => (
              <ChannelTypeButton
                key={type.id}
                type="button"
                active={channelType === type.id}
                onClick={() => setChannelType(type.id)}
              >
                <FontAwesomeIcon className="icon" icon={type.icon} />
                <br />
                {type.name}
              </ChannelTypeButton>
            ))}
          </div>
          <Input
            labelName="Channel Name"
            placeholder="New Channel"
            {...register('name')}
          />
          <Button variant="primary" type="submit">
            Create Channel
          </Button>
        </Form>
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
          setModal({ elem: <CreateChannelModal /> });
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
