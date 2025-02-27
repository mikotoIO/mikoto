import { Box, Button, Group, Heading, Input } from '@chakra-ui/react';
import styled from '@emotion/styled';
import {
  faFileAlt,
  faHashtag,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Channel,
  ChannelType,
  MikotoChannel,
  MikotoSpace,
} from '@mikoto-io/mikoto.js';
import { permissions } from '@mikoto-io/permcheck';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';

import { ContextMenu, modalState } from '@/components/ContextMenu';
import { DialogContent, Field } from '@/components/ui';
import { useErrorElement } from '@/hooks/useErrorElement';
import { useTabkit } from '@/store/surface';
import { Form } from '@/ui';

import { channelToTab } from './channelToTab';

const channelTypes = [
  { id: 'TEXT', name: 'Text', icon: faHashtag },
  { id: 'VOICE', name: 'Voice', icon: faMicrophone },
  { id: 'DOCUMENT', name: 'Note', icon: faFileAlt },
];

const ChannelTypeButton = styled.button<{ active?: boolean }>`
  background-color: var(--chakra-colors-gray-800);
  border: 2px solid
    ${(p) => (p.active ? 'var(--chakra-colors-blue-500)' : 'transparent')};
  color: var(--chakra-colors-gray-200);
  font-size: 16px;
  border-radius: 8px;
  min-width: 100px;
  min-height: 100px;
  margin: 8px;
  cursor: pointer;

  .icon {
    margin-bottom: 8px;
    font-size: 24px;
    color: var(--chakra-colors-gray-500);
  }

  transition: border-color 0.1s ease-in-out;
`;

export function CreateChannelModal({
  space,
  channel,
}: {
  space: MikotoSpace;
  channel?: Channel;
}) {
  const setModal = useSetRecoilState(modalState);
  const { register, handleSubmit } = useForm();

  const [channelType, setChannelType] = useState<ChannelType>('TEXT');
  const error = useErrorElement();

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Box>
        <Heading fontSize="xl" mt={0} mb={1}>
          {channel ? 'Create Subchannel' : 'Create Channel'}
        </Heading>
        {channel && (
          <Box as="p" m={0} color="gray.300">
            In #{channel.name}
          </Box>
        )}
        <Form
          mt={4}
          onSubmit={handleSubmit((data) => {
            try {
              space.createChannel({
                name: data.name,
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
                onClick={() => setChannelType(type.id as ChannelType)}
              >
                <FontAwesomeIcon className="icon" icon={type.icon} />
                <br />
                {type.name}
              </ChannelTypeButton>
            ))}
          </div>
          <Field label="Channel Name">
            <Input placeholder="New Channel" {...register('name')} />
          </Field>

          <Button colorPalette="primary" type="submit">
            Create Channel
          </Button>
        </Form>
      </Box>
    </DialogContent>
  );
}

function DeleteChannelModal({ channel }: { channel: MikotoChannel }) {
  const setModal = useSetRecoilState(modalState);

  return (
    <DialogContent rounded="md" p={4} maxW="480px">
      <Box pb={4}>
        Are you sure you want to delete the channel{' '}
        <strong>#{channel.name}</strong>?
      </Box>
      <Group>
        <Button
          colorPalette="danger"
          onClick={async () => {
            await channel.delete();
            setModal(null);
          }}
        >
          Delete
        </Button>
        <Button
          colorPalette="secondary"
          onClick={() => {
            setModal(null);
          }}
        >
          Cancel
        </Button>
      </Group>
    </DialogContent>
  );
}

export const ChannelContextMenu = ({ channel }: { channel: MikotoChannel }) => {
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
      <ContextMenu.Link
        onClick={() => {
          tabkit.openTab(
            {
              kind: 'channelSettings',
              key: `channelSettings/${channel.id}`,
              channelId: channel.id,
            },
            false,
          );
        }}
      >
        Channel Settings
      </ContextMenu.Link>
      {channel.space!.member!.checkPermission(permissions.superuser) && (
        <>
          <ContextMenu.Link
            onClick={() => {
              const { space } = channel;
              if (!space) {
                console.error('channel has no space. probably a bug.');
                return;
              }
              setModal({
                elem: <CreateChannelModal space={space} channel={channel} />,
              });
            }}
          >
            Create Subchannel
          </ContextMenu.Link>
          <ContextMenu.Link
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/?m=${channel.id}`,
              );
            }}
          >
            Copy Channel Link
          </ContextMenu.Link>
          <ContextMenu.Link
            onClick={() => {
              setModal({ elem: <DeleteChannelModal channel={channel} /> });
            }}
          >
            Delete Channel
          </ContextMenu.Link>
        </>
      )}
    </ContextMenu>
  );
};
