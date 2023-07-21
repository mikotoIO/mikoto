import { MantineProvider } from '@mantine/core';
import * as Sentry from '@sentry/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom/client';
import 'react-loading-skeleton/dist/skeleton.css';
import { Provider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

import App from './App';
import { GlobalStyle, theme } from './lucid';
import { store } from './redux';
import reportWebVitals from './reportWebVitals';

/// global polyfill
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

const SENTRY = false;

if (SENTRY) {
  Sentry.init({
    dsn: 'https://ac7d9a74a0c7492b8eb1a13b09a9b3bc@o4505128286158848.ingest.sentry.io/4505128290746368',
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

const SilentRecoilRoot = RecoilRoot as any;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SilentRecoilRoot>
    <Provider store={store}>
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
    </Provider>
  </SilentRecoilRoot>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
