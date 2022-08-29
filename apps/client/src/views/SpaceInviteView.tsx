import styled from 'styled-components';
import { Button } from '@mantine/core';
import { useAsync } from 'react-async-hook';
import { useParams } from 'react-router-dom';
import { AuthRefresher } from '../components/AuthHandler';
import { useMikoto } from '../api';
import { Spinner } from '../components/atoms/Spinner';

const bgUrl = 'https://mikoto.io/images/hero-placeholder.jpg';

const Background = styled.div`
  width: 100vw;
  height: 100vh;
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
  background-color: ${(p) => p.theme.colors.N900};
  width: 600px;
  box-sizing: border-box;
  text-align: center;
  padding: 32px;
  border-radius: 8px;
  color: white;
  box-shadow: rgba(0, 0, 0, 0.2) 0 8px 15px;
`;

export function SpaceInviteViewInner() {
  const mikoto = useMikoto();
  const params = useParams<{ id: string }>();

  const { result } = useAsync(
    async (id: string) => mikoto.getSpace(id),
    [params.id ?? ''],
  );

  return (
    <Background>
      <InvitationBox>
        {result ? (
          <div>
            <h1>{result.name}</h1>
            <Button>Join Space</Button>
          </div>
        ) : (
          <Spinner />
        )}
      </InvitationBox>
    </Background>
  );
}

export function SpaceInviteView() {
  return (
    <AuthRefresher>
      <SpaceInviteViewInner />
    </AuthRefresher>
  );
}
