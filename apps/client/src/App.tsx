import { BrowserRouter, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';

import {
  LoginView,
  RegisterView,
  ResetChangePasswordView,
  ResetPasswordView,
} from './views/AuthView';
import MainView from './views/MainView';
import { MikotoApiLoader } from './views/MikotoApiLoader';
import { SpaceInviteView } from './views/SpaceInviteView';
import { WindowBar } from './views/WindowBar';

const AppShell = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

export const IS_ELECTRON = navigator.userAgent.indexOf('Electron') !== -1;

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        {IS_ELECTRON && <WindowBar />}
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgotpassword" element={<ResetPasswordView />} />
          <Route
            path="/forgotpassword/:token"
            element={<ResetChangePasswordView />}
          />
          <Route
            path="/invite/:inviteCode"
            element={
              <MikotoApiLoader>
                <SpaceInviteView />
              </MikotoApiLoader>
            }
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
