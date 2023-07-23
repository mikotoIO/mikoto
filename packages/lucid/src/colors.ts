import parseCSSColor from 'parse-css-color';

export function transparency(color: string, alpha: number) {
  const {
    type,
    values: [a, b, c],
  } = parseCSSColor(color)!;
  if (type === 'rgb') {
    return `rgba(${a}, ${b}, ${c}, ${alpha})`;
  }
  // hsl
  return `hsla(${a}, ${b}%, ${c}%, ${alpha})`;
}
