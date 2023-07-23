import parseCSSColor from 'parse-css-color';

export function transparency(color: string, alpha: number) {
  const [r, g, b] = parseCSSColor(color)!.values;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
