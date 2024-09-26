import styled from '@emotion/styled';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import {
  LoginView,
  RegisterView,
  ResetChangePasswordView,
  ResetPasswordView,
} from '@/views/AuthView';
import MainView from '@/views/MainView';
import { MikotoClientProvider } from '@/views/MikotoClientProvider';
import { NotFound } from '@/views/NotFoundPage';
import { SpaceInviteView } from '@/views/SpaceInviteView';

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
      <MikotoClientProvider>
        <SpaceInviteView />
      </MikotoClientProvider>
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
