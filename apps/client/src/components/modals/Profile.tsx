import { Box, Button, Flex, Group, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UserExt } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';

import { modalState } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { DialogContent } from '@/components/ui';
import { useMikoto } from '@/hooks';

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

export function ProfileModal({ user }: { user: UserExt }) {
  const mikoto = useMikoto();
  const setModal = useSetAtom(modalState);

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
                <Group>
                  <Button
                    colorPalette="success"
                    onClick={async () => {
                      // FIXME: the fuck is this
                      // await mikoto.client.relations.openDm({
                      //   relationId: '2a36685a-6236-4fbe-92bf-b3025fd92cfb',
                      // });

                      setModal(null);
                    }}
                  >
                    Send Friend Request
                  </Button>
                  <Button
                    colorPalette="secondary"
                    onClick={async () => {
                      // const dm = await mikoto.client.relations.openDm({
                      //   relationId: user.id,
                      // });
                      await mikoto.rest['relations.openDm'](undefined, {
                        params: { relationId: user.id },
                      });
                      // TODO: Rework DMs
                      // const spaceId = dm.space?.id;
                      // if (spaceId) {
                      //   setSpace({
                      //     kind: 'explorer',
                      //     key: `explorer/${spaceId}`,
                      //     spaceId,
                      //   });
                      // }
                      // setModal(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                  </Button>
                </Group>
              )}
            </div>
          </Flex>
          <p>{user.description}</p>
        </Box>
      </ProfileContainer>
    </DialogContent>
  );
}
