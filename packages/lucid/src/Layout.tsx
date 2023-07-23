import type * as CSS from 'csstype';
import styled, { css } from 'styled-components';

export type Dimension =
  | number
  | string
  | undefined
  | Partial<{
      x: number | string;
      y: number | string;
      top: number | string;
      left: number | string;
      right: number | string;
      bottom: number | string;
    }>;

export type Direction = 'top' | 'bottom' | 'left' | 'right';

function computeUnits(
  dim: Dimension,
  dir: Direction,
): string | number | undefined {
  if (typeof dim !== 'object') {
    return dim;
  }
  switch (dir) {
    case 'top':
      return dim.y ?? dim.top;
    case 'bottom':
      return dim.y ?? dim.bottom;
    case 'left':
      return dim.x ?? dim.left;
    case 'right':
      return dim.x ?? dim.right;
    default:
      return undefined;
  }
}

function unitToPixel(unit?: string | number): string | undefined {
  if (unit === undefined) return undefined;
  if (typeof unit === 'number') return `${unit}px`;
  return unit;
}

export type BoxProps = Partial<{
  m: Dimension;
  p: Dimension;
  w: number | string;
  h: number | string;
  bg: string;
  txt: string;
  fs: number;
  mix: CSS.Properties[];
  rounded: number | string;
  gap: number | string;
}>;

export const boxCss = css<BoxProps>((props) => ({
  marginTop: unitToPixel(computeUnits(props.m, 'top')),
  marginBottom: unitToPixel(computeUnits(props.m, 'bottom')),
  marginLeft: unitToPixel(computeUnits(props.m, 'left')),
  marginRight: unitToPixel(computeUnits(props.m, 'right')),
  paddingTop: unitToPixel(computeUnits(props.p, 'top')),
  paddingBottom: unitToPixel(computeUnits(props.p, 'bottom')),
  paddingLeft: unitToPixel(computeUnits(props.p, 'left')),
  paddingRight: unitToPixel(computeUnits(props.p, 'right')),
  boxSizing: 'border-box',

  width: unitToPixel(props.w),
  height: unitToPixel(props.h),
  backgroundColor: props.bg && `var(--${props.bg})`,
  color: props.txt && `var(--${props.txt})`,
  fontSize: unitToPixel(props.fs),
  ...props.mix?.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
  borderRadius: unitToPixel(props.rounded),
  gap: unitToPixel(props.gap),
}));

export const Box = styled.div<BoxProps>`
  ${boxCss}
`;

export interface GridProps {
  tcol: string;
  trow: string;
}

export const Grid = styled(Box)<Partial<GridProps>>((props) => ({
  display: 'grid',
  gridTemplateColumns: props.tcol,
  gridTemplateRows: props.trow,
}));

export interface FlexProps {
  dir: 'row' | 'column';
  center: boolean;
}

export const Flex = styled(Box)<Partial<FlexProps>>((props) => ({
  display: 'flex',
  flexDirection: props.dir,
  alignItems: props.center ? 'center' : undefined,
  justifyContent: props.center ? 'center' : undefined,
}));

export const Image = styled(Box)``;

Image.defaultProps = {
  as: 'img',
};

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
