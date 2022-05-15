import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoginView, RegisterView } from './views/AuthView';
import MainView from './views/MainView';
import { ContextMenuKit } from './components/ContextMenu';
import { RoomPage } from './components/LiveKitPlayground';
import { SettingsView } from './views/SettingsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/livekit" element={<RoomPage />} />
      </Routes>
      <ContextMenuKit />
    </BrowserRouter>
  );
}

export default App;
