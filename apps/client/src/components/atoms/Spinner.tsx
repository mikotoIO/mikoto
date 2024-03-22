import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

const wanderDistance = '35px';

const anim = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: translateX(${wanderDistance}) rotate(-90deg) scale(0.6);
  }
  50% { 
    transform: translateX(${wanderDistance}) translateY(${wanderDistance}) rotate(-179deg);
  }
  50.1% {
    transform: translateX(${wanderDistance}) translateY(${wanderDistance}) rotate(-180deg);
  }
  75% {
    transform: translateX(0) translateY(${wanderDistance}) rotate(-270deg) scale(0.6);
  }
  100% {
    transform: rotate(-360deg);
  }
`;

const SpinnerElement = styled.div<SpinnerProps>`
  width: ${(p) => p.size ?? '64px'};
  height: ${(p) => p.size ?? '64px'};
  position: relative;

  .sk-wander-cube {
    background-color: ${(p) => p.color ?? 'white'};
    width: 30%;
    height: 30%;
    position: absolute;
    top: 0;
    left: 0;
    --sk-wander-distance: calc(100px * 0.75);
    animation: ${anim} 2s ease-in-out -2s infinite both;
  }
  .sk-wander-cube:nth-of-type(2) {
    animation-delay: -1s;
    background-color: ${(p) => p.color2 ?? '#3b83ff'};
  }
`;

export interface SpinnerProps {
  size?: string;
  color?: string;
  color2?: string;
}

export function Spinner(props: SpinnerProps) {
  return (
    <SpinnerElement {...props}>
      <div className="sk-wander-cube" />
      <div className="sk-wander-cube" />
    </SpinnerElement>
  );
}
