import styled from 'styled-components';

import { boxCss, BoxProps } from './Layout';

export const Anchor = styled.a<BoxProps>`
  &:visited {
    color: var(--${(p) => p.txt});
  }
  ${boxCss}
`;

Anchor.defaultProps = {
  as: 'a',
  txt: 'B500',
};
