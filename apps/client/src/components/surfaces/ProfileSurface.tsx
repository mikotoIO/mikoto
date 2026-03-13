import { Box, Button, Flex, Group, Heading } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UserExt } from '@mikoto-io/mikoto.js';

import { Surface } from '@/components/Surface';
import { Avatar } from '@/components/atoms/Avatar';
import { TabName } from '@/components/tabs';
import { useMikoto } from '@/hooks';

const ProfileContainer = styled.div`
  .banner {
    background-color: var(--chakra-colors-gray-800);
    padding: 16px;
    height: 128px;
  }

  .avatar {
    transform: translateY(50%);
  }
`;

const MikotoId = styled.h2`
  font-size: 14px;
  margin-top: 0;
  font-family: var(--chakra-fonts-code);
  color: var(--chakra-colors-gray-500);
`;

export function ProfileSurface({ user }: { user: UserExt }) {
  const mikoto = useMikoto();

  return (
    <Surface>
      <TabName name={user.name} icon={faUser} />
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
                  <Button colorPalette="success">Send Friend Request</Button>
                  <Button
                    colorPalette="secondary"
                    onClick={async () => {
                      await mikoto.rest['relations.openDm'](undefined, {
                        params: { relationId: user.id },
                      });
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
    </Surface>
  );
}
