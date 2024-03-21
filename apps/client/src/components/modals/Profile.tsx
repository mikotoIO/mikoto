import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  ModalContent,
} from '@chakra-ui/react';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { User } from 'mikotojs';
import { useSetRecoilState } from 'recoil';
import styled from 'styled-components';

import { useMikoto } from '../../hooks';
import { treebarSpaceState } from '../../store';
import { modalState } from '../ContextMenu';
import { Avatar } from '../atoms/Avatar';
import { Tag } from '../atoms/BotTag';

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

  ${Tag} {
    font-size: 12px;
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

export function ProfileModal({ user }: { user: User }) {
  const mikoto = useMikoto();
  const setSpace = useSetRecoilState(treebarSpaceState);
  const setModal = useSetRecoilState(modalState);

  return (
    <ModalContent rounded="md" p={0} width="640px">
      <ProfileContainer>
        <div className="banner">
          <Avatar
            className="avatar"
            src={user.avatar ?? undefined}
            size={100}
          />
        </div>
        <Box p={4} pt={12}>
          <Flex justifyContent="space-between">
            <div>
              <Heading fontSize="24px" mb={0}>
                {user.name}
              </Heading>
              <MikotoId>@cactus.mikoto.io</MikotoId>
            </div>
            <div>
              {mikoto.me.id !== user.id && (
                <ButtonGroup>
                  <Button
                    variant="success"
                    onClick={async () => {
                      await mikoto.client.relations.openDm({
                        relationId: '2a36685a-6236-4fbe-92bf-b3025fd92cfb',
                      });

                      setModal(null);
                    }}
                  >
                    Send Friend Request
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const dm = await mikoto.client.relations.openDm({
                        relationId: user.id,
                      });
                      const spaceId = dm.space?.id;
                      if (spaceId) {
                        setSpace({
                          kind: 'explorer',
                          key: `explorer/${spaceId}`,
                          spaceId,
                        });
                      }
                      setModal(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                  </Button>
                </ButtonGroup>
              )}
            </div>
          </Flex>
          <Heading as="h2" fontSize="xl" mt={2}>
            Bio
          </Heading>
          <p>Bio Should go here. Lorem ipsum dolor sit amet consectetur.</p>
        </Box>
      </ProfileContainer>
    </ModalContent>
  );
}
