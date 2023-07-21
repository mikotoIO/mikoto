import { Button } from '@mikoto-io/lucid';
import { useAsync } from 'react-async-hook';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { StyledSpaceIcon } from '../components/atoms/SpaceIcon';
import { Spinner } from '../components/atoms/Spinner';
import { useMikoto } from '../hooks';

const bgUrl = '/images/artworks/1.jpg';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  height: 100vh;
`;

const Background = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  background: url(${bgUrl}) no-repeat center center fixed;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
`;

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
  const params = useParams<{ id: string }>();

  const { result: space } = useAsync(
    async (id: string) => mikoto.client.spaces.get(id),
    [params.id ?? ''],
  );

  return (
    <Grid>
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
                // TODO: Rewrite to use invite links instead of server IDs!
                await mikoto.client.spaces.join(space.id);
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
      <Background />
    </Grid>
  );
}

export function SpaceInviteView() {
  return <SpaceInviteViewInner />;
}
