import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import {RecoilRoot} from "recoil";
import { ThemeProvider } from 'styled-components';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { theme } from './themes';
import { MantineProvider } from '@mantine/core';
import MikotoApi, { MikotoContext } from "./api";
import Constants from "./constants";
const SilentRecoilRoot = RecoilRoot as any;

ReactDOM.createRoot(document.getElementById('root')!)
  .render(
    <React.StrictMode>
      <SilentRecoilRoot>
        <ThemeProvider theme={theme}>
          <MantineProvider theme={{ colorScheme: 'dark' }}>
            <MikotoContext.Provider value={new MikotoApi(Constants.ApiPath)}>
              <App />
            </MikotoContext.Provider>
          </MantineProvider>
        </ThemeProvider>
      </SilentRecoilRoot>
    </React.StrictMode>
  );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
