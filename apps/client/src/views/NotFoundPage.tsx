import styled from 'styled-components';

const StyledNotFound = styled.div`
  height: 100vh;
  width: 100vw;
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
