import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Mikoto',
    },
    links: [
      {
        text: 'Users',
        url: '/users',
        on: 'nav',
      },
      {
        text: 'Developers',
        url: '/developers',
        on: 'nav',
      },
      {
        text: 'Contributors',
        url: '/contributors',
        on: 'nav',
      },
      {
        text: 'API Reference',
        url: '/api-reference',
        on: 'nav',
      },
    ],
    githubUrl: 'https://github.com/mikotoIO/mikoto',
  };
}
