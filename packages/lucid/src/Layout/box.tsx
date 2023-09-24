import type * as CSS from 'csstype';
import { StyledObject, css } from 'styled-components';

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

function computeColor(color: string): string {
  if (/^[A-Z]\d+$/i.test(color)) {
    return `var(--${color})`;
  }
  return color;
}

export type BoxProps = Partial<{
  m: Dimension;
  p: Dimension;
  w: number | string;
  h: number | string;
  maxw: number | string;
  maxh: number | string;
  minw: number | string;
  minh: number | string;
  bg: string;
  txt: string;
  fs: number;
  mix: CSS.Properties[];
  rounded: number | string;
  gap: number | string;
  tf: string[];
}>;

export const boxCss = css<BoxProps>((props): StyledObject<object> => {
  const cssObject: StyledObject<object> = {
    boxSizing: 'border-box',
    ...props.mix?.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
  };

  Object.keys(props).forEach((key) => {
    switch (key) {
      case 'm':
        cssObject.marginTop = unitToPixel(computeUnits(props.m, 'top'));
        cssObject.marginBottom = unitToPixel(computeUnits(props.m, 'bottom'));
        cssObject.marginLeft = unitToPixel(computeUnits(props.m, 'left'));
        cssObject.marginRight = unitToPixel(computeUnits(props.m, 'right'));
        break;
      case 'p':
        cssObject.paddingTop = unitToPixel(computeUnits(props.p, 'top'));
        cssObject.paddingBottom = unitToPixel(computeUnits(props.p, 'bottom'));
        cssObject.paddingLeft = unitToPixel(computeUnits(props.p, 'left'));
        cssObject.paddingRight = unitToPixel(computeUnits(props.p, 'right'));
        break;
      case 'w':
        cssObject.width = unitToPixel(props.w);
        break;
      case 'h':
        cssObject.height = unitToPixel(props.h);
        break;
      case 'maxw':
        cssObject.maxWidth = unitToPixel(props.maxw);
        break;
      case 'maxh':
        cssObject.maxHeight = unitToPixel(props.maxh);
        break;
      case 'minw':
        cssObject.minWidth = unitToPixel(props.minw);
        break;
      case 'minh':
        cssObject.minHeight = unitToPixel(props.minh);
        break;
      case 'bg':
        cssObject.backgroundColor = computeColor(props.bg!);
        break;
      case 'txt':
        cssObject.color = computeColor(props.txt!);
        break;
      case 'fs':
        cssObject.fontSize = unitToPixel(props.fs);
        break;
      case 'rounded':
        cssObject.borderRadius = unitToPixel(props.rounded);
        break;
      case 'gap':
        cssObject.gap = unitToPixel(props.gap);
        break;
      case 'tf':
        cssObject.transform = props.tf?.join(' ');
        break;
      default:
        break;
    }
  });
  return cssObject;
});
