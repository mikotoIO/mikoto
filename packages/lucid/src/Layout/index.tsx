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
  display: grid;
  ${(p) => p.tcol && `grid-template-columns: ${p.tcol};`}
  ${(p) => p.trow && `grid-template-rows: ${p.trow};`}
  ${boxCss}
`;

export type FlexProps = Partial<{
  dir: 'row' | 'column';
  center: boolean;
  justifyContent: CSS.Properties['justifyContent'];
  alignItems: CSS.Properties['alignItems'];
}>;

export const Flex = styled.div<FlexProps & BoxProps>`
  display: flex;
  ${(p) => p.dir && `flex-direction: ${p.dir};`}
  ${(p) => p.center && `align-items: center; justify-content: center;`}
  ${(p) => p.justifyContent && `justify-content: ${p.justifyContent};`}
  ${(p) => p.alignItems && `align-items: ${p.alignItems};`}
  ${boxCss}
`;

type ImageProps = Partial<{}>;

export const Image = styled.img<ImageProps & BoxProps>`
  ${boxCss}
`;
Image.defaultProps = { as: 'img' };

export function defineMix(props: CSS.Properties) {
  return props;
}

export function backgroundMix(image: string, overlayColor?: string) {
  return defineMix({
    background: overlayColor
      ? `linear-gradient(${overlayColor}, ${overlayColor}) 0% 0% / cover, 
      url(${image}) no-repeat center center`
      : `url(${image}) no-repeat center center`,
    WebkitBackgroundSize: 'cover',
    MozBackgroundSize: 'cover',
    backgroundSize: 'cover',
  });
}

export { boxCss };
export type { BoxProps };
