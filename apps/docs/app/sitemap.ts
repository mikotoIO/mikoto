import type { MetadataRoute } from 'next';

import { source } from '@/lib/source';

// Public origin of the docs site. Override with DOCS_SITE_URL when the site
// is served somewhere other than docs.mikoto.io (for example a preview).
const siteUrl = (process.env.DOCS_SITE_URL ?? 'https://docs.mikoto.io').replace(
  /\/$/,
  '',
);

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    changeFrequency: 'weekly',
  }));
}
