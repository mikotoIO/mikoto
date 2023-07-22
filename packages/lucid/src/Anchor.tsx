import styled from 'styled-components';

import { Box } from './Layout';

export const Anchor = styled(Box)`
  color: var(--B500);
`;

Anchor.defaultProps = {
  as: 'a',
};
