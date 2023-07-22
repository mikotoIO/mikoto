import type * as CSS from 'csstype';
import styled from 'styled-components';

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

export interface BoxProps {
  margin?: Dimension;
  padding?: Dimension;
  w?: number | string;
  h?: number | string;
  bg?: string;
  txt?: string;
  fs?: number;
  mix?: CSS.Properties[];
}

export const Box = styled.div<BoxProps>((props) => ({
  marginTop: unitToPixel(computeUnits(props.margin, 'top')),
  marginBottom: unitToPixel(computeUnits(props.margin, 'bottom')),
  marginLeft: unitToPixel(computeUnits(props.margin, 'left')),
  marginRight: unitToPixel(computeUnits(props.margin, 'right')),
  paddingTop: unitToPixel(computeUnits(props.padding, 'top')),
  paddingBottom: unitToPixel(computeUnits(props.padding, 'bottom')),
  paddingLeft: unitToPixel(computeUnits(props.padding, 'left')),
  paddingRight: unitToPixel(computeUnits(props.padding, 'right')),

  width: unitToPixel(props.w),
  height: unitToPixel(props.h),
  backgroundColor: `var(--${props.bg})`,
  color: `var(--${props.txt})`,
  fontSize: unitToPixel(props.fs),
  ...props.mix?.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
}));

export interface GridProps {
  tcol?: string;
  trow?: string;
  gap?: number | string;
}

export const Grid = styled(Box)<GridProps>((props) => ({
  display: 'grid',
  gridTemplateColumns: props.tcol,
  gridTemplateRows: props.trow,
  gap: unitToPixel(props.gap),
}));

export interface FlexProps {
  center?: boolean;
}

export const Flex = styled(Box)<FlexProps>((props) => ({
  display: 'flex',
  alignItems: props.center ? 'center' : undefined,
  justifyContent: props.center ? 'center' : undefined,
}));

export function defineMix(props: CSS.Properties) {
  return props;
}

export function backgroundMix(image: string) {
  return defineMix({
    background: `url(${image}) no-repeat center center fixed`,
    backgroundSize: 'cover',
    WebkitBackgroundSize: 'cover',
    MozBackgroundSize: 'cover',
  });
}
