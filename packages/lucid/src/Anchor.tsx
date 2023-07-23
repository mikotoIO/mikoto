import styled from 'styled-components';

import { boxCss, BoxProps } from './Layout';

export const Anchor = styled.a<BoxProps>`
  ${boxCss}

  &:visited {
    color: var(--${(p) => p.txt});
  }
`;

Anchor.defaultProps = {
  as: 'a',
  txt: 'B500',
};
