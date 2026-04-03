import { Box, Button, Flex, Group, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MikotoSpace, UserExt } from '@mikoto-io/mikoto.js';
import { useSetAtom } from 'jotai';

import { modalState } from '@/components/ContextMenu';
import { Avatar } from '@/components/atoms/Avatar';
import { DialogContent } from '@/components/ui';
import { useMikoto } from '@/hooks';
import { useCrypto } from '@/hooks/useCrypto';
import { treebarSpaceState } from '@/store';

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
  const crypto = useCrypto();
  const setModal = useSetAtom(modalState);
  const setLeftSidebar = useSetAtom(treebarSpaceState);

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
                      await mikoto.relationships.request(user.id);
                      setModal(null);
                    }}
                  >
                    Send Friend Request
                  </Button>
                  <Button
                    colorPalette="secondary"
                    onClick={async () => {
                      const dm = await mikoto.relationships.openDm(user.id);

                      // If this is a new DM, create the MLS group and send Welcome
                      if (dm.created && crypto && dm.keyPackages.length > 0) {
                        const { welcome } = await crypto.createDmGroup(
                          dm.space.id,
                          dm.keyPackages.map((kp) => kp.data),
                        );

                        // Send Welcome messages via the MLS relay
                        await mikoto.rest['mlsMessages.send']({
                          messages: [
                            {
                              recipientUserId: user.id,
                              mlsGroupId: dm.mlsGroup.id,
                              messageType: 'welcome',
                              data: welcome,
                            },
                          ],
                        });
                      }

                      // Ensure the space is in our cache
                      const space = new MikotoSpace(dm.space, mikoto);

                      setLeftSidebar({
                        kind: 'dmExplorer',
                        key: `dmExplorer/${space.id}`,
                        spaceId: space.id,
                        relationId: user.id,
                      });
                      setModal(null);
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
