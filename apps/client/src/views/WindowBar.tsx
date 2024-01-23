import styled from 'styled-components';

const StyledWindowBar = styled.div`
  height: 36px;
  -webkit-app-region: drag;
  display: flex;
`;

export function WindowBar() {
  return <StyledWindowBar />;
}
