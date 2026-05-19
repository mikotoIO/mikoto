import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { getLayoutTabs } from 'fumadocs-ui/layouts/shared';
import type { ReactNode } from 'react';

import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

const TAB_ORDER = ['/users', '/developers', '/contributors', '/api-reference'];

const tabs = getLayoutTabs(source.pageTree).sort((a, b) => {
  const ai = TAB_ORDER.findIndex((prefix) => a.url.startsWith(prefix));
  const bi = TAB_ORDER.findIndex((prefix) => b.url.startsWith(prefix));
  return (
    (ai === -1 ? TAB_ORDER.length : ai) - (bi === -1 ? TAB_ORDER.length : bi)
  );
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} tabs={tabs} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
