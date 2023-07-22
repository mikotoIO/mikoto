import styled from 'styled-components';

import { Grid } from './Layout';

export const Form = styled(Grid).attrs(() => ({
  as: 'form',
}))`
  grid-gap: 8px;
  padding: 16px 0;
`;
