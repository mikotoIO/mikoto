import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import 'react-loading-skeleton/dist/skeleton.css';

import { RecoilRoot } from 'recoil';
import { ThemeProvider } from 'styled-components';
import { MantineProvider } from '@mantine/core';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { theme } from './components/themes';
import MikotoClient, { constructMikoto, MikotoContext } from './api';
import constants from './constants';

/// global polyfill
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

const SilentRecoilRoot = RecoilRoot as any;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SilentRecoilRoot>
    <ThemeProvider theme={theme}>
      <MantineProvider theme={{ colorScheme: 'dark' }}>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </MantineProvider>
    </ThemeProvider>
  </SilentRecoilRoot>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
