import { Box } from '@mikoto-io/lucid';
import styled from 'styled-components';

const StyledWindowBar = styled.div`
  height: 24px;
  -webkit-app-region: drag;
  background-color: var(--N1000);
  display: flex;
  color: white;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
`;

const WindowDots = styled.div`
  display: flex;
  gap: 6px;
`;

const StyledDot = styled(Box)`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(0, 0, 0, 0.1);
  }
`;

function Buttons() {
  return (
    <WindowDots>
      <StyledDot bg="G700" />
      <StyledDot bg="Y700" />
      <StyledDot bg="R700" />
    </WindowDots>
  );
}

export function WindowBar() {
  return (
    <StyledWindowBar>
      <div />
      <div>
        <Buttons />
      </div>
    </StyledWindowBar>
  );
}
