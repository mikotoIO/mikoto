import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
} from '@chakra-ui/react';
import {
  faFileAlt,
  faHashtag,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Buttons, Form, Modal } from '@mikoto-io/lucid';
import { permissions } from '@mikoto-io/permcheck';
import {
  Channel,
  ClientChannel,
  ClientSpace,
  checkMemberPermission,
} from 'mikotojs';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useErrorElement } from '../../../hooks/useErrorElement';
import { useTabkit } from '../../../store/surface';
import { ContextMenu, modalState } from '../../ContextMenu';
import { channelToTab } from './channelToTab';

const channelTypes = [
  { id: 'TEXT', name: 'Text', icon: faHashtag },
  { id: 'VOICE', name: 'Voice', icon: faMicrophone },
  { id: 'DOCUMENT', name: 'Note', icon: faFileAlt },
];

const StyledCreateChannelModal = styled.div`
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

export function CreateChannelModal({
  space,
  channel,
}: {
  space: ClientSpace;
  channel?: Channel;
}) {
  const setModal = useSetRecoilState(modalState);
  const { register, handleSubmit } = useForm();

  const [channelType, setChannelType] = useState('TEXT');
  const error = useErrorElement();

  return (
    <Modal>
      <StyledCreateChannelModal>
        <Heading fontSize="xl" mt={0}>
          {channel ? 'Create Subchannel' : 'Create Channel'}
        </Heading>
        {channel && <p className="subchannelinfo">In #{channel.name}</p>}
        <Form
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
                onClick={() => setChannelType(type.id)}
              >
                <FontAwesomeIcon className="icon" icon={type.icon} />
                <br />
                {type.name}
              </ChannelTypeButton>
            ))}
          </div>
          <FormControl>
            <FormLabel>Channel Name</FormLabel>
            <Input placeholder="New Channel" {...register('name')} />
          </FormControl>

          <Button variant="primary" type="submit">
            Create Channel
          </Button>
        </Form>
      </StyledCreateChannelModal>
    </Modal>
  );
}

function DeleteChannelModal({ channel }: { channel: ClientChannel }) {
  const setModal = useSetRecoilState(modalState);

  return (
    <Modal>
      <Box p={{ bottom: 16 }}>
        Are you sure you want to delete the channel{' '}
        <strong>#{channel.name}</strong>?
      </Box>
      <Buttons>
        <Button
          variant="danger"
          onClick={async () => {
            await channel.delete();
            setModal(null);
          }}
        >
          Delete
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setModal(null);
          }}
        >
          Cancel
        </Button>
      </Buttons>
    </Modal>
  );
}

export const ChannelContextMenu = observer(
  ({ channel }: { channel: ClientChannel }) => {
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
        {checkMemberPermission(
          channel.space!.member!,
          permissions.superuser,
        ) && (
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
  },
);
