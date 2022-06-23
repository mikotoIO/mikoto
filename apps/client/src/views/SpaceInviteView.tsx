import styled from 'styled-components';
import { Button } from '@mantine/core';

const bgUrl =
  'https://pbs.twimg.com/media/Eorpv-TVQAANWlr?format=jpg&name=large';

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
  background-color: ${(p) => p.theme.colors.N900};
  width: 600px;
  min-height: 400px;
  box-sizing: border-box;
  text-align: center;
  padding: 32px;
  border-radius: 8px;
  color: white;
  box-shadow: rgba(0, 0, 0, 0.2) 0 8px 15px;
`;

export function SpaceInviteView() {
  return (
    <Background>
      <InvitationBox>
        <h1>
          <b>Spacename</b> wants you to join space
        </h1>
        <Button>Join Space</Button>
      </InvitationBox>
    </Background>
  );
}
