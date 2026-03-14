import styled from '@emotion/styled';

const StyledNotFound = styled.div`
  height: 100dvh;
  width: 100dvw;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export function NotFound() {
  return (
    <StyledNotFound>
      <h1>404</h1> Not Found
    </StyledNotFound>
  );
}
