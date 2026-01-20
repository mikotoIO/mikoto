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
  // Base route
  {
    path: '/',
    element: <MainView />,
  },
  // Global surfaces
  {
    path: '/spaces',
    element: <MainView />,
  },
  {
    path: '/friends',
    element: <MainView />,
  },
  {
    path: '/discover',
    element: <MainView />,
  },
  {
    path: '/palette',
    element: <MainView />,
  },
  // Account settings
  {
    path: '/settings',
    element: <MainView />,
  },
  {
    path: '/settings/bots/:botId',
    element: <MainView />,
  },
  // Space routes
  {
    path: '/space/:spaceId/settings',
    element: <MainView />,
  },
  {
    path: '/space/:spaceId/search',
    element: <MainView />,
  },
  // Channel routes
  {
    path: '/space/:spaceId/channel/:channelId',
    element: <MainView />,
  },
  {
    path: '/space/:spaceId/channel/:channelId/settings',
    element: <MainView />,
  },
  // Auth routes
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
