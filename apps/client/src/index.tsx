import { MantineProvider } from '@mantine/core';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom/client';
import 'react-loading-skeleton/dist/skeleton.css';
import { RecoilRoot } from 'recoil';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

import App from './App';
import { GlobalStyle } from './components/GlobalStyle';
import { theme } from './components/themes';
import reportWebVitals from './reportWebVitals';

/// global polyfill
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

const SilentRecoilRoot = RecoilRoot as any;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SilentRecoilRoot>
    <StyleSheetManager disableCSSOMInjection>
      <ThemeProvider theme={theme}>
        <MantineProvider theme={{ colorScheme: 'dark' }}>
          <DndProvider backend={HTML5Backend}>
            <>
              <GlobalStyle />
              <App />
            </>
          </DndProvider>
        </MantineProvider>
      </ThemeProvider>
    </StyleSheetManager>
  </SilentRecoilRoot>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
