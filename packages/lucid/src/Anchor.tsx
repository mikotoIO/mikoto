import styled from 'styled-components';

import { boxCss, BoxProps } from './Layout';

export const Anchor = styled.a<BoxProps>`
  &:visited {
    color: var(--${(p) => p.txt});
  }
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }

  ${boxCss}
`;

Anchor.defaultProps = {
  as: 'a',
  txt: 'B500',
};
