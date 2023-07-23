import type * as CSS from 'csstype';
import styled from 'styled-components';

import { BoxProps, boxCss } from './box';

export const Box = styled.div<BoxProps>`
  ${boxCss}
`;

export type GridProps = Partial<{
  tcol: string;
  trow: string;
}>;

export const Grid = styled.div<GridProps & BoxProps>`
  ${boxCss}
  display: grid;
  ${(p) => p.tcol && `grid-template-columns: ${p.tcol};`}
  ${(p) => p.trow && `grid-template-rows: ${p.trow};`}
`;

export type FlexProps = Partial<{
  dir: 'row' | 'column';
  center: boolean;
}>;

export const Flex = styled.div<FlexProps & BoxProps>`
  ${boxCss}
  display: flex;
  ${(p) => p.dir && `flex-direction: ${p.dir};`}
  ${(p) => p.center && `align-items: center; justify-content: center;`}
`;

export const Image = styled.img`
  ${boxCss}
`;
Image.defaultProps = { as: 'img' };

export function defineMix(props: CSS.Properties) {
  return props;
}

export function backgroundMix(image: string) {
  return defineMix({
    background: `url(${image}) no-repeat center center`,
    WebkitBackgroundSize: 'cover',
    MozBackgroundSize: 'cover',
    backgroundSize: 'cover',
  });
}

export { boxCss };
export type { BoxProps };
