// shamelessly lifted from Lexical playground
export class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public equals({ x, y }: Point): boolean {
    return this.x === x && this.y === y;
  }

  public calcDeltaXTo({ x }: Point): number {
    return this.x - x;
  }

  public calcDeltaYTo({ y }: Point): number {
    return this.y - y;
  }

  public calcHorizontalDistanceTo(point: Point): number {
    return Math.abs(this.calcDeltaXTo(point));
  }

  public calcVerticalDistance(point: Point): number {
    return Math.abs(this.calcDeltaYTo(point));
  }

  public calcDistanceTo(point: Point): number {
    return Math.sqrt(
      Math.pow(this.calcDeltaXTo(point), 2) +
        Math.pow(this.calcDeltaYTo(point), 2),
    );
  }
}

export function isPoint(x: unknown): x is Point {
  return x instanceof Point;
}

type ContainsPointReturn = {
  result: boolean;
  reason: {
    isOnTopSide: boolean;
    isOnBottomSide: boolean;
    isOnLeftSide: boolean;
    isOnRightSide: boolean;
  };
};

export class Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;

  constructor(left: number, top: number, right: number, bottom: number) {
    const [physicTop, physicBottom] =
      top <= bottom ? [top, bottom] : [bottom, top];

    const [physicLeft, physicRight] =
      left <= right ? [left, right] : [right, left];

    this.top = physicTop;
    this.right = physicRight;
    this.left = physicLeft;
    this.bottom = physicBottom;
  }

  get width(): number {
    return Math.abs(this.left - this.right);
  }

  get height(): number {
    return Math.abs(this.bottom - this.top);
  }

  public equals({ top, left, bottom, right }: Rect): boolean {
    return (
      top === this.top &&
      bottom === this.bottom &&
      left === this.left &&
      right === this.right
    );
  }

  public contains({ x, y }: Point): ContainsPointReturn;
  public contains({ top, left, bottom, right }: Rect): boolean;
  public contains(target: Point | Rect): boolean | ContainsPointReturn {
    if (isPoint(target)) {
      const { x, y } = target;

      const isOnTopSide = y < this.top;
      const isOnBottomSide = y > this.bottom;
      const isOnLeftSide = x < this.left;
      const isOnRightSide = x > this.right;

      const result =
        !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide;

      return {
        reason: {
          isOnBottomSide,
          isOnLeftSide,
          isOnRightSide,
          isOnTopSide,
        },
        result,
      };
    } else {
      const { top, left, bottom, right } = target;

      return (
        top >= this.top &&
        top <= this.bottom &&
        bottom >= this.top &&
        bottom <= this.bottom &&
        left >= this.left &&
        left <= this.right &&
        right >= this.left &&
        right <= this.right
      );
    }
  }

  public intersectsWith(rect: Rect): boolean {
    const { left: x1, top: y1, width: w1, height: h1 } = rect;
    const { left: x2, top: y2, width: w2, height: h2 } = this;
    const maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
    const maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
    const minX = x1 <= x2 ? x1 : x2;
    const minY = y1 <= y2 ? y1 : y2;
    return maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2;
  }

  public generateNewRect({
    left = this.left,
    top = this.top,
    right = this.right,
    bottom = this.bottom,
  }): Rect {
    return new Rect(left, top, right, bottom);
  }

  static fromLTRB(
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): Rect {
    return new Rect(left, top, right, bottom);
  }

  static fromLWTH(
    left: number,
    width: number,
    top: number,
    height: number,
  ): Rect {
    return new Rect(left, top, left + width, top + height);
  }

  static fromPoints(startPoint: Point, endPoint: Point): Rect {
    const { y: top, x: left } = startPoint;
    const { y: bottom, x: right } = endPoint;
    return Rect.fromLTRB(left, top, right, bottom);
  }

  static fromDOM(dom: HTMLElement): Rect {
    const { top, width, left, height } = dom.getBoundingClientRect();
    return Rect.fromLWTH(left, width, top, height);
  }
}

export function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement;
}
