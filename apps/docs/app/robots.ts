import type { MetadataRoute } from 'next';

const siteUrl = (process.env.DOCS_SITE_URL ?? 'https://docs.mikoto.io').replace(
  /\/$/,
  '',
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
