import { css } from 'styled-components';

export const theme = {
  colors: {
    N1200: 'hsl(220, 4%, 11%)', // darkest
    N1100: 'hsl(220, 4%, 15%)', // darkest
    N1000: 'hsl(220, 7%, 17%)', // darkest
    N900: 'hsl(220, 7%, 20%)', // darker
    N800: 'hsl(220, 8%, 23%)', // backgrounds
    N700: 'hsl(220, 8%, 27%)', // backgrounds
    N0: 'hsl(220, 4%, 100%)',

    B800: 'hsl(207, 74%, 44%)',
  },
};

export const centerFlex = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;
