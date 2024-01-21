import styled from 'styled-components';

const StyledWindowBar = styled.div`
  height: 20px;
  -webkit-app-region: drag;
  background-color: var(--N1000);
`;

export function WindowBar() {
  return <StyledWindowBar>{}</StyledWindowBar>;
}
