import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginView, RegisterView } from './views/AuthView';
import MainView from './views/MainView';
import { ContextMenuKit } from './components/ContextMenu';
import { RoomPage } from './components/LiveKitPlayground';
import { SpaceInviteView } from './views/SpaceInviteView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/invite" element={<SpaceInviteView />} />
        <Route path="/livekit" element={<RoomPage />} />
      </Routes>
      <ContextMenuKit />
    </BrowserRouter>
  );
}

export default App;
