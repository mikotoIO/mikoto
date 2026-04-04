import { Box, Button, Flex, Group, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoChannel, MikotoRelationship, UserExt } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';
import { useSnapshot } from 'valtio/react';

import { modalState } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { DialogContent } from '@/components/ui';
import { toaster } from '@/components/ui/toaster';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

const ProfileContainer = styled.div`
  width: 640px;
  height: 480px;

  .banner {
    background-color: var(--chakra-colors-gray-800);
    padding: 16px;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    height: 128px;
  }
  .content {
    padding: 48px 16px 16px;
  }

  .avatar {
    transform: translateY(50%);
  }
`;

const MikotoId = styled.h2`
  font-size: 20px;
  margin-top: 0;
  font-size: 14px;
  font-family: var(--chakra-fonts-code);
  color: var(--chakra-colors-gray-500);
`;

function useRelationshipFor(userId: string): MikotoRelationship | undefined {
  const mikoto = useMikoto();
  useSnapshot(mikoto.relationships.cache);
  return mikoto.relationships
    .values()
    .find((r) => r.relationId === userId);
}

function RelationshipButtons({
  user,
  relation,
}: {
  user: UserExt;
  relation: MikotoRelationship | undefined;
}) {
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);
  const tabkit = useTabkit();

  const handleSendRequest = async () => {
    try {
      await mikoto.relationships.sendRequest(user.id);
      toaster.success({ title: 'Friend request sent!' });
    } catch (err) {
      console.error('Failed to send friend request:', err);
      toaster.error({ title: 'Failed to send friend request' });
    }
  };

  const handleOpenDm = async () => {
    try {
      const channelData = await mikoto.rest['relations.openDm'](undefined, {
        params: { relationId: user.id },
      });
      const channel = new MikotoChannel(channelData, mikoto);
      tabkit.openTab(
        {
          kind: 'textChannel',
          key: channel.id,
          channelId: channel.id,
        },
        false,
      );
      setModal(null);
    } catch {
      toaster.error({ title: 'Failed to open DM' });
    }
  };

  if (!relation) {
    return (
      <Button colorPalette="success" onClick={handleSendRequest}>
        Send Friend Request
      </Button>
    );
  }

  switch (relation.state) {
    case 'FRIEND':
      return (
        <Group>
          <Button
            variant="ghost"
            colorPalette="red"
            onClick={() => relation.remove()}
          >
            Remove Friend
          </Button>
          <Button colorPalette="secondary" onClick={handleOpenDm}>
            <FontAwesomeIcon icon={faEnvelope} />
          </Button>
        </Group>
      );
    case 'OUTGOING_REQUEST':
      return (
        <Button disabled colorPalette="gray">
          Request Pending
        </Button>
      );
    case 'INCOMING_REQUEST':
      return (
        <Group>
          <Button
            colorPalette="success"
            onClick={() => relation.accept()}
          >
            Accept Request
          </Button>
          <Button
            variant="ghost"
            colorPalette="red"
            onClick={() => relation.decline()}
          >
            Decline
          </Button>
        </Group>
      );
    case 'BLOCKED':
      return (
        <Button
          variant="ghost"
          colorPalette="red"
          onClick={() => relation.unblock()}
        >
          Unblock
        </Button>
      );
    default:
      return (
        <Button colorPalette="success" onClick={handleSendRequest}>
          Send Friend Request
        </Button>
      );
  }
}

export function ProfileModal({ user }: { user: UserExt }) {
  const mikoto = useMikoto();
  const relation = useRelationshipFor(user.id);

  return (
    <DialogContent rounded="lg" p={0} maxWidth="640px">
      <ProfileContainer>
        <div className="banner">
          <Avatar
            className="avatar"
            src={user.avatar ?? undefined}
            userId={user.id}
            size={100}
          />
        </div>
        <Box p={4} pt={12}>
          <Flex justifyContent="space-between">
            <div>
              <Heading fontSize="24px" mb={0}>
                {user.name}
              </Heading>
              {user.handle && <MikotoId>@{user.handle}</MikotoId>}
            </div>
            <div>
              {mikoto.user.me?.id !== user.id && (
                <RelationshipButtons user={user} relation={relation} />
              )}
            </div>
          </Flex>
          <p>{user.description}</p>
        </Box>
      </ProfileContainer>
    </DialogContent>
  );
}
