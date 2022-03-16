import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {atom} from "recoil";
import {LoginView, RegisterView} from "./views/AuthView";
import MainView from "./views/MainView";

const accessTokenAtom = atom<string>({
  key: 'user',
  default: '',
})

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
