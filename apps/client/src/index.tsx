import { Global } from '@emotion/react';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ReactDOM from 'react-dom/client';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RecoilEnv, RecoilRoot } from 'recoil';

import App from '@/App';
import { chakraTheme, globalCss } from '@/components/chakraTheme';
import { Provider as ChakraProvider } from '@/components/ui/provider';
import { env } from '@/env';
import reportWebVitals from '@/reportWebVitals';

// Import styles
import 'dockview-react/dist/styles/dockview.css';
import './dockview.css';
import './fonts.css';
import { queryClient } from './functions/queryClient';
import './i18n';

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
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

RecoilEnv.RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED = !env.DEV;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RecoilRoot>
        <ChakraProvider forcedTheme="dark">
          <QueryClientProvider client={queryClient}>
            <DndProvider backend={HTML5Backend}>
              <>
                <Helmet>
                  {env.DEV && (
                    <link rel="icon" type="image/png" href="/favicon-dev.ico" />
                  )}
                </Helmet>
                <Global styles={globalCss} />
                <App />
                <ToastContainer theme="dark" limit={3} />
              </>
            </DndProvider>
          </QueryClientProvider>
        </ChakraProvider>
      </RecoilRoot>
    </HelmetProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
