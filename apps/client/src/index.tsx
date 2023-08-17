import { MantineProvider } from '@mantine/core';
import { GlobalStyle, LucidProvider, theme } from '@mikoto-io/lucid';
import * as Sentry from '@sentry/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom/client';
import { Helmet } from 'react-helmet';
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RecoilRoot, RecoilEnv } from 'recoil';
import { StyleSheetManager, ThemeProvider } from 'styled-components';

// eslint-disable-next-line import/no-relative-packages
import '../../../packages/lucid/src/fonts.css';
import App from './App';
import { env } from './env';
import './i18n';
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

// RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = !env.DEV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RecoilRoot>
    <StyleSheetManager disableCSSOMInjection>
      <LucidProvider>
        <ThemeProvider theme={theme}>
          <MantineProvider theme={{ colorScheme: 'dark' }}>
            <DndProvider backend={HTML5Backend}>
              <>
                <Helmet>
                  {env.DEV && (
                    <link rel="icon" type="image/png" href="/favicon-dev.ico" />
                  )}
                </Helmet>
                <GlobalStyle />
                <App />
                <ToastContainer theme="dark" limit={3} />
              </>
            </DndProvider>
          </MantineProvider>
        </ThemeProvider>
      </LucidProvider>
    </StyleSheetManager>
  </RecoilRoot>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
