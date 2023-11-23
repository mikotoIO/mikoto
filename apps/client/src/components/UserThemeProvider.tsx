import { theme } from '@mikoto-io/lucid';
import { createGlobalStyle } from 'styled-components';

import { DEFAULT_THEME_SETTINGS, themeDB } from '../store';
import { useLocalDB } from '../store/LocalDB';

function colorWithFallback(color: string, fallback: string) {
  return CSS.supports('color', color) ? color : fallback;
}

const GlobalStyle = createGlobalStyle<{
  userTheme: typeof DEFAULT_THEME_SETTINGS;
}>`
  :root {
    --color-primary: ${(props) =>
      colorWithFallback(props.userTheme.accent, theme.colors.B700)}
  }
`;

export function UserThemeProvider() {
  const [themes] = useLocalDB(themeDB);
  return <GlobalStyle userTheme={themes} />;
}
