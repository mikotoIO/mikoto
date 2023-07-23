import { IStyledComponent } from 'styled-components';

type FastOmit<T extends object, U extends string | number | symbol> = {
  [K in keyof T as K extends U ? never : K]: T[K];
};

export type StyledComponent<T, P = {}> = IStyledComponent<
  'web',
  FastOmit<React.DetailedHTMLProps<React.HTMLAttributes<T>, T>, never> & P
>;
