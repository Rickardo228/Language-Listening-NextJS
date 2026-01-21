import type { MetadataRoute } from 'next';
import { client } from '@/lib/sanity';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.languageshadowing.com';

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeSiteUrl(SITE_URL);
  const now = new Date().toISOString();

  const [pillars, articles] = await Promise.all([
    client.fetch<Array<{ slug: { current: string }; publishedAt?: string }>>(
      `*[_type == "article" && defined(slug.current) && slug.current == pillar]{
        slug,
        publishedAt
      }`
    ),
    client.fetch<Array<{ slug: { current: string }; pillar?: string; publishedAt?: string }>>(
      `*[_type == "article" && defined(slug.current)]{
        slug,
        pillar,
        publishedAt
      }`
    ),
  ]);

  const pillarEntries: MetadataRoute.Sitemap = pillars.map((pillar) => ({
    url: `${baseUrl}/${pillar.slug.current}`,
    lastModified: pillar.publishedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/${article.pillar || 'language-shadowing'}/${article.slug.current}`,
    lastModified: article.publishedAt || now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pillarEntries,
    ...articleEntries,
  ];
}
