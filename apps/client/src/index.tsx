import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { RecoilRoot } from 'recoil';
import { ThemeProvider } from 'styled-components';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { theme } from './themes';
import { MantineProvider } from '@mantine/core';
import MikotoApi, { MikotoContext } from './api';
import constants from './constants';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const SilentRecoilRoot = RecoilRoot as any;

ReactDOM.render(
  <React.StrictMode>
    <SilentRecoilRoot>
      <ThemeProvider theme={theme}>
        <MantineProvider theme={{ colorScheme: 'dark' }}>
          <DndProvider backend={HTML5Backend}>
            <MikotoContext.Provider value={new MikotoApi(constants.apiPath)}>
              <App />
            </MikotoContext.Provider>
          </DndProvider>
        </MantineProvider>
      </ThemeProvider>
    </SilentRecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')!,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
