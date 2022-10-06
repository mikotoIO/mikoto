import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginView, RegisterView } from './views/AuthView';
import MainView from './views/MainView';
import { ContextMenuKit, ModalKit } from './components/ContextMenu';
import { SpaceInviteView } from './views/SpaceInviteView';
import { RoomPage } from './components/LiveKitPlayground';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/invite/:id" element={<SpaceInviteView />} />
        <Route path="/livekit" element={<RoomPage />} />
      </Routes>
      <ContextMenuKit />
      <ModalKit />
    </BrowserRouter>
  );
}

export default App;
