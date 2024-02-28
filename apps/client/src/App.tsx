import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import styled from 'styled-components';

import {
  LoginView,
  RegisterView,
  ResetChangePasswordView,
  ResetPasswordView,
} from './views/AuthView';
import MainView from './views/MainView';
import { MikotoApiLoader } from './views/MikotoApiLoader';
import { NotFound } from './views/NotFoundPage';
import { SpaceInviteView } from './views/SpaceInviteView';

const AppShell = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
`;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainView />,
  },
  {
    path: '/login',
    element: <LoginView />,
  },
  {
    path: '/register',
    element: <RegisterView />,
  },
  {
    path: '/forgotpassword',
    element: <ResetPasswordView />,
  },
  {
    path: '/forgotpassword/:token',
    element: <ResetChangePasswordView />,
  },
  {
    path: '/invite/:inviteCode',
    element: (
      <MikotoApiLoader>
        <SpaceInviteView />
      </MikotoApiLoader>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <AppShell>
      <RouterProvider router={router} />
    </AppShell>
  );
}

export default App;
