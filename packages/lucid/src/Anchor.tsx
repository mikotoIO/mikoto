import styled from 'styled-components';

import { Box, BoxProps } from './Layout';

export const Anchor = styled.a<BoxProps>`
  ${Box}
  color: var(--B500);
`;

Anchor.defaultProps = {
  as: 'a',
};
