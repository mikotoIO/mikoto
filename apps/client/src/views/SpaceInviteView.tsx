import { Button, Flex, Grid, backgroundMix } from '@mikoto-io/lucid';
import { Space } from 'mikotojs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { StyledSpaceIcon } from '../components/atoms/SpaceIcon';
import { Spinner } from '../components/atoms/Spinner';
import { useMikoto } from '../hooks';

const InvitationBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: var(--N900);
  box-sizing: border-box;
  text-align: center;
  padding: 32px;
  border-radius: 8px;
  color: var(--N0);

  .information {
    margin-top: 32px;
    color: var(--N300);
  }
`;

export function SpaceInviteViewInner() {
  const mikoto = useMikoto();
  const [space, setSpace] = useState<Space | null>(null);
  const { inviteCode } = useParams<{ inviteCode: string }>();

  useEffect(() => {
    mikoto.client.spaces
      .getSpaceFromInvite({
        inviteCode: inviteCode ?? '',
      })
      .then((x) => {
        setSpace(x);
      });
  }, [inviteCode ?? '']);

  return (
    <Grid tcol="400px 1fr" h="100vh">
      <InvitationBox>
        {space ? (
          <>
            <StyledSpaceIcon size={100} active icon={space.icon ?? undefined}>
              {space.icon === null ? space.name[0] : ''}
            </StyledSpaceIcon>
            <h1>{space.name}</h1>
            <Button
              variant="primary"
              onClick={async () => {
                // TODO: Proper fix for malformed invite links
                await mikoto.client.spaces.join({
                  inviteCode: inviteCode ?? '',
                });
                window.location.href = `/`;
              }}
            >
              Accept Invite
            </Button>
          </>
        ) : (
          <Spinner />
        )}
      </InvitationBox>
      <Flex mix={[backgroundMix('/images/artworks/1.jpg')]} center />
    </Grid>
  );
}

export function SpaceInviteView() {
  return <SpaceInviteViewInner />;
}
