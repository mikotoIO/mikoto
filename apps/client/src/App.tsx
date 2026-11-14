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

import styles from './App.module.css';

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
  // Space routes (spaceRef can be a UUID or @handle)
  {
    path: '/space/:spaceRef',
    element: <MainView />,
  },
  {
    path: '/space/:spaceRef/settings',
    element: <MainView />,
  },
  {
    path: '/space/:spaceRef/search',
    element: <MainView />,
  },
  // Channel routes (spaceRef can be a UUID or @handle)
  {
    path: '/space/:spaceRef/channel/:channelId',
    element: <MainView />,
  },
  {
    path: '/space/:spaceRef/channel/:channelId/settings',
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
    <div className={styles.shell}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
