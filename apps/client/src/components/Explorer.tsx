import {
  faFileAlt,
  faHashtag,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Input, Button, Modal } from '@mikoto-io/lucid';
import { permissions } from '@mikoto-io/permcheck';
import {
  Channel,
  ClientChannel,
  ClientSpace,
  checkMemberPermission,
} from 'mikotojs';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../hooks';
import { useErrorElement } from '../hooks/useErrorElement';
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
  background-color: var(--N900);
  border: 2px solid ${(p) => (p.active ? 'var(--B700)' : 'var(--N600)')};
  color: var(--N100);
  font-size: 16px;
  border-radius: 8px;
  min-width: 100px;
  min-height: 100px;
  margin: 8px;
  cursor: pointer;

  .icon {
    margin-bottom: 8px;
    font-size: 24px;
    color: var(--N400);
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
    <Modal>
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
    </Modal>
  );
}

function TreebarContextMenu({ space }: { space: ClientSpace }) {
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
  background-color: var(--N1000);

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

const ChannelContextMenu = observer(
  ({ channel }: { channel: ClientChannel }) => {
    const mikoto = useMikoto();
    const tabkit = useTabkit();
    const setModal = useSetRecoilState(modalState);

    return (
      <ContextMenu>
        <ContextMenu.Link
          onClick={() => {
            tabkit.openTab(channelToTab(channel), true);
          }}
        >
          Open in new tab
        </ContextMenu.Link>
        <ContextMenu.Link>Mark as Read</ContextMenu.Link>
        {checkMemberPermission(
          channel.space!.member!,
          permissions.superuser,
        ) && (
          <>
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
          </>
        )}
      </ContextMenu>
    );
  },
);

function isUnread(lastUpdate: Date | null, ack: Date | null) {
  if (lastUpdate === null || ack === null) return false;
  return lastUpdate.getTime() > ack.getTime();
}

export const Explorer = observer(({ space }: { space: ClientSpace }) => {
  const tabkit = useTabkit();
  const mikoto = useMikoto();

  const [acks, setAcks] = React.useState<Record<string, Date>>({});

  useEffect(() => {
    mikoto.client.messages.listUnread(space.id).then((ur) => {
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
      mikoto.client.messages.ack(channel.id, now.toISOString()).then(() => {
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
      <ExplorerNext nodes={channelTree.descendant!} />
    </StyledTree>
  );
});
