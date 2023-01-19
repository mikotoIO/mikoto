import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './App.css';
import { ModalKit } from './components/ContextMenu';
import { RoomPage } from './components/LiveKitPlayground';
import { LoginView, RegisterView, ResetPasswordView } from './views/AuthView';
import MainView from './views/MainView';
import { SpaceInviteView } from './views/SpaceInviteView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/forgotpassword" element={<ResetPasswordView />} />
        <Route path="/invite/:id" element={<SpaceInviteView />} />
        <Route path="/livekit" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
