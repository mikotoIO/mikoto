import styled, { css, keyframes } from 'styled-components';

const dotFlash = keyframes`
  0% {
    background-color: var(--N300);
  }
  100% {
    background-color: var(--N600);
  }
`;

const dots = css`
  background-color: var(--N0);
  width: 8px;
  height: 8px;
  border-radius: 100%;
  display: inline-block;
  top: 0;
  animation: ${dotFlash} 1s infinite alternate;
`;

export const TypingDots = styled.div`
  ${dots}
  position: relative;
  margin-right: 20px;
  margin-left: 12px;
  animation-delay: 1s;
  &:before {
    content: ' ';
    ${dots}
    position: absolute;
    left: -12px;
    animation-delay: 0.5s;
  }
  &:after {
    content: ' ';
    animation-delay: 1s;
    ${dots}
    position: absolute;
    left: 12px;
  }
`;
