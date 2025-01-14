import { Button, Flex, Grid } from '@chakra-ui/react';
import styled from '@emotion/styled';
import { SpaceExt } from '@mikoto-io/mikoto.js';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { StyledSpaceIcon } from '@/components/atoms/SpaceIcon';
import { useMikoto } from '@/hooks';
import { Spinner } from '@/ui/Spinner';

const InvitationBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: var(--chakra-colors-gray-800);
  box-sizing: border-box;
  text-align: center;
  padding: 32px;
  border-radius: 8px;
  color: var(--chakra-colors-white);
`;

export function SpaceInviteViewInner() {
  const mikoto = useMikoto();
  const [space, setSpace] = useState<SpaceExt | null>(null);
  const inviteCode = useParams<{ inviteCode: string }>().inviteCode ?? '';

  useEffect(() => {
    // mikoto.client.spaces.getSpaceFromInvite({ inviteCode }).then((x) => {
    //   setSpace(x);
    // });
    mikoto.rest['spaces.preview']({ params: { invite: inviteCode } }).then(
      (x) => {
        setSpace(x);
      },
    );
  }, [inviteCode]);

  return (
    <Grid templateColumns="400px 1fr" h="100vh">
      <InvitationBox>
        {space ? (
          <>
            <StyledSpaceIcon size="100px" icon={normalizeMediaUrl(space.icon)}>
              {space.icon === null ? space.name[0] : ''}
            </StyledSpaceIcon>
            <h1>{space.name}</h1>
            <Button
              colorPalette="primary"
              onClick={async () => {
                // TODO: test for invalid links, links that have already been accepted
                // links that have expired, etc.
                // also add a loading indicator
                // TODO: BEFORE THAT, improve Hyperschema error handling
                // apparently I did not do a good enough job at it
                try {
                  await mikoto.rest['spaces.join'](undefined, {
                    params: { invite: inviteCode },
                  });
                  window.location.href = `/`;
                } catch (e) {
                  console.log('error joining space:');
                  console.log(e);
                }
              }}
            >
              Accept Invite
            </Button>
          </>
        ) : (
          <Spinner />
        )}
      </InvitationBox>
      <Flex
        bg="url('/images/artworks/2.jpg') no-repeat center center"
        bgSize="cover"
      />
    </Grid>
  );
}

export function SpaceInviteView() {
  return <SpaceInviteViewInner />;
}
