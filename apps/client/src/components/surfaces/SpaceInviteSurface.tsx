import { Box, Button, Flex, Heading } from '@chakra-ui/react';
import { faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SpaceExt } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { StyledSpaceIcon } from '@/components/atoms/SpaceIcon';
import { useMikoto } from '@/hooks';
import { useTabkit } from '@/store/surface';

import { Surface } from '../Surface';
import { TabName } from '../tabs';

export function SpaceInviteSurface({
  inviteCode,
}: {
  inviteCode: string;
}) {
  const mikoto = useMikoto();
  const tabkit = useTabkit();
  const [space, setSpace] = useState<SpaceExt | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mikoto.rest['spaces.preview']({ params: { invite: inviteCode } }).then(
      (x) => setSpace(x),
      () => setError('Invalid or expired invite link.'),
    );
  }, [inviteCode]);

  const onAccept = async () => {
    setJoining(true);
    try {
      await mikoto.rest['spaces.join'](undefined, {
        params: { invite: inviteCode },
      });
      tabkit.removeTab(`spaceInvite/${inviteCode}`);
    } catch (e) {
      setError('Failed to join space.');
      setJoining(false);
    }
  };

  const onDecline = () => {
    tabkit.removeTab(`spaceInvite/${inviteCode}`);
  };

  return (
    <Surface>
      <TabName name={space ? `Invite: ${space.name}` : 'Space Invite'} icon={faEnvelope} />
      <Box>
        <Flex
          h="200px"
          bg="url('/images/artworks/2.jpg') no-repeat center center"
          bgSize="cover"
        />
        <Flex p={8} direction="column" gap={8}>
          <Heading fontSize="lg" m={0} color="gray.400">
            You got a new space invite!
          </Heading>
          {error ? (
            <Box color="red.400">{error}</Box>
          ) : space ? (
            <>
              <Flex align="center" gap={4}>
                <StyledSpaceIcon
                  size="64px"
                  icon={normalizeMediaUrl(space.icon)}
                >
                  {space.icon ? '' : space.name[0]}
                </StyledSpaceIcon>
                <Heading m={0}>{space.name}</Heading>
              </Flex>
              <Box color="gray.400" fontSize="sm">
                <Box as="span" mr={2}>
                  <FontAwesomeIcon icon={faUser} />
                </Box>
                {space.channels.length} Channels
              </Box>
              <Flex direction="column" gap={2} maxW="400px">
                <Button
                  colorPalette="primary"
                  onClick={onAccept}
                  disabled={joining}
                >
                  {joining ? 'Joining...' : `Join ${space.name}`}
                </Button>
                <Button
                  size="sm"
                  colorPalette="primary"
                  variant="ghost"
                  onClick={onDecline}
                >
                  No, Thanks
                </Button>
              </Flex>
            </>
          ) : (
            <Box color="gray.400">Loading...</Box>
          )}
        </Flex>
      </Box>
    </Surface>
  );
}
