import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { createElement } from 'react';

import { openapi } from './openapi';

export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: await openapi.staticSource({
      baseDir: 'api-reference',
      meta: true,
    }),
  },
  {
    baseUrl: '/',
    plugins: [openapi.loaderPlugin()],
    icon(icon) {
      if (!icon) return;
      if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
    },
    pageTree: {
      transformers: [
        {
          folder(node, folderPath) {
            if (folderPath === 'api-reference') {
              return {
                ...node,
                root: true,
                name: 'API Reference',
                icon: createElement(icons.Webhook),
              };
            }
            return node;
          },
        },
      ],
    },
  },
);
