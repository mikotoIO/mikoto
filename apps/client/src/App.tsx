import { BrowserRouter, Route, Routes } from 'react-router-dom';

import {
  LoginView,
  RegisterView,
  ResetPasswordView,
  ResetChangePasswordView,
} from './views/AuthView';
import MainView from './views/MainView';
import { MikotoApiLoader } from './views/MikotoApiLoader';
import { SpaceInviteView } from './views/SpaceInviteView';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
