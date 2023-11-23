import styled from 'styled-components';

import { Flex, Grid } from './Layout';

export const Form = styled(Flex).attrs(() => ({
  as: 'form',
}))`
  flex-direction: column;
  grid-gap: 8px;
`;

export const FormRow = styled(Grid)`
  grid-template-columns: repeat(auto-fill, 1fr);
`;
