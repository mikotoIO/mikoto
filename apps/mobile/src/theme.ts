export const neutrals = {
  N1200: 'hsl(225, 12%, 6%)',
  N1100: 'hsl(225, 12%, 10%)',
  N1000: 'hsl(225, 12%, 15%)',
  N900: 'hsl(225, 12%, 18%)',
  N800: 'hsl(225, 12%, 20%)',
  N700: 'hsl(225, 12%, 25%)',
  N600: 'hsl(225, 16%, 31%)',
  N500: 'hsl(225, 16%, 42%)',
  N400: 'hsl(225, 16%, 60%)',
  N300: 'hsl(225, 16%, 81%)',
  N200: 'hsl(225, 20%, 93%)',
  N100: 'hsl(225, 20%, 97%)',
  N0: 'hsl(225, 0%, 100%)',
};

export const blues = {
  B1000: 'hsl(214, 100%, 11%)',
  B900: 'hsl(214, 100%, 20%)',
  B800: 'hsl(214, 100%, 37%)',
  B700: 'hsl(214, 100%, 50%)',
  B600: 'hsl(214, 96%, 60%)',
  B500: 'hsl(214, 92%, 70%)',
  B400: 'hsl(214, 90%, 75%)',
  B300: 'hsl(214, 88%, 80%)',
};

export const purples = {
  V1000: 'hsl(282, 100%, 11%)',
  V900: 'hsl(282, 100%, 20%)',
  V800: 'hsl(282, 100%, 37%)',
  V700: 'hsl(282, 90%, 50%)',
  V600: 'hsl(282, 86%, 60%)',
  V500: 'hsl(282, 82%, 70%)',
};

export const greens = {
  G800: 'hsl(159, 100%, 33%)',
  G700: 'hsl(159, 100%, 42%)',
  G600: 'hsl(159, 98%, 55%)',
};

export const reds = {
  R800: 'hsl(350, 90%, 33%)',
  R700: 'hsl(350, 90%, 44%)',
  R600: 'hsl(350, 90%, 55%)',
};

export const yellows = {
  Y700: 'hsl(33, 100%, 55%)',
  Y600: 'hsl(33, 100%, 65%)',
};

export const colors = {
  ...neutrals,
  ...blues,
  ...purples,
  ...greens,
  ...reds,
  ...yellows,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  heading: 28,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
