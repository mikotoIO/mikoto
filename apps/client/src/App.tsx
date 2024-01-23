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

const AppShell = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;


function App() {
  return (
    <BrowserRouter>
      <AppShell>
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
