import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/onest';
import '@fontsource/atkinson-hyperlegible-next/400.css';
import '@fontsource/atkinson-hyperlegible-next/600.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
// Import styles
import 'dockview-react/dist/styles/dockview.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// PWA disabled due to caching issues
// import { registerSW } from 'virtual:pwa-register';
import App from '@/App';
import {
  AppearanceRoot,
  Toaster,
  TooltipProvider,
  appearanceDB,
  applyAppearance,
} from '@/design';
import '@/design/dockview.css';
import '@/design/global.css';
import '@/design/tokens.css';
import { env } from '@/env';
import reportWebVitals from '@/reportWebVitals';

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

// Apply saved appearance before the first paint so there is no theme flash.
applyAppearance(appearanceDB.get());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <>
          <Helmet>
            {env.DEV && (
              <link rel="icon" type="image/png" href="/favicon-dev.ico" />
            )}
          </Helmet>
          <AppearanceRoot />
          <TooltipProvider delay={400}>
            <App />
          </TooltipProvider>
          <Toaster />
        </>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// PWA disabled due to caching issues
// registerSW({ ... });
