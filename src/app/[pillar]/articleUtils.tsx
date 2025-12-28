import { Metadata } from 'next';
import { cache } from 'react';
import { client } from '@/lib/sanity';
import { PortableText } from '@/components/PortableText';

export interface SanityArticle {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  keywords?: string[];
  language: string;
  pillar: string;
  category?: string;
  searchVolume?: number;
  competition?: number;
  quickAnswer?: string;
  body: any[];
  publishedAt?: string;
}

export const getSanityArticle = cache(async (slug: string): Promise<SanityArticle | null> => {
  try {
    console.log(`🔍 Fetching Sanity article for slug: ${slug}`);

    const article = await client.fetch<SanityArticle>(
      `*[_type == "article" && slug.current == $slug][0]{
        _id,
        title,
        slug,
        description,
        keywords,
        language,
        pillar,
        category,
        searchVolume,
        competition,
        quickAnswer,
        body,
        publishedAt
      }`,
      { slug }
    );

    if (article) {
      console.log(`✅ Found Sanity article: ${article.title}`);
    } else {
      console.log(`⚠️ No Sanity article found for slug: ${slug}`);
    }

    return article;
  } catch (error) {
    console.error('❌ Error fetching Sanity article:', error);
    return null;
  }
});

export function buildArticleMetadata(article: SanityArticle, canonicalPath: string): Metadata {
  return {
    title: article.title,
    description: article.description || article.quickAnswer,
    keywords: article.keywords || [],
    openGraph: {
      title: article.title,
      description: article.description || article.quickAnswer || '',
      type: 'article',
      publishedTime: article.publishedAt,
    },
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export function buildArticleSchema(article: SanityArticle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || article.quickAnswer,
    author: {
      '@type': 'Organization',
      name: 'Language Shadowing',
    },
    datePublished: article.publishedAt,
    keywords: article.keywords?.join(', '),
  };
}

export function ArticleContent({ article }: { article: SanityArticle }) {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {article.title}
        </h1>

        {article.quickAnswer && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 p-6 mb-8">
            <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
              {article.quickAnswer}
            </p>
          </div>
        )}

        {article.description && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            {article.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {article.category && (
            <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
              {article.category}
            </span>
          )}
          {article.publishedAt && (
            <span>
              Published: {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <PortableText value={article.body} articleSlug={article.slug?.current} />
      </div>
    </article>
  );
}
