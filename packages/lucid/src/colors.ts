import parseCSSColor from 'parse-css-color';

export function transparency(color: string, alpha: number) {
  const {
    type,
    values: [r, g, b],
  } = parseCSSColor(color)!;
  return `${type}a(${r}, ${g}, ${b}, ${alpha})`;
}
