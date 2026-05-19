import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Mikoto',
    },
    links: [
      {
        text: 'API Reference',
        url: '/api-reference',
      },
    ],
    githubUrl: 'https://github.com/mikoto-io/mikoto',
  };
}
