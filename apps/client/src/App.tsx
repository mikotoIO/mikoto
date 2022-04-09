import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {atom} from "recoil";
import {LoginView, RegisterView} from "./views/AuthView";
import MainView from "./views/MainView";
import styled from "styled-components";
import {ContextMenuKit} from "./components/ContextMenu";

const accessTokenAtom = atom<string>({
  key: 'user',
  default: '',
});

const ContextMenuOverlay = styled.div`
  position: fixed;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
`;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
      </Routes>
      <ContextMenuKit />
    </BrowserRouter>
  );
}

export default App;
