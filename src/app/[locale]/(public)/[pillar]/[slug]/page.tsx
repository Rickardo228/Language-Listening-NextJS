import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import {
  ArticleContent,
  buildArticleMetadata,
  buildArticleSchema,
  getSanityArticle,
} from '../articleUtils';

interface PageProps {
  params: {
    pillar: string;
    slug: string;
  };
}

// Revalidate pages every hour for fresh content (ISR)
export const revalidate = 3600;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pillar, slug } = await params;

  const sanityArticle = await getSanityArticle(slug);
  if (sanityArticle) {
    return buildArticleMetadata(sanityArticle, `/${pillar}/${slug}`);
  }

  return {
    title: 'Page Not Found',
    robots: {
      index: false,
      follow: false,
    },
  };
}

// Main page component (Server-side rendered)
export default async function ListPage({ params }: PageProps) {
  const { pillar, slug } = await params;

  const sanityArticle = await getSanityArticle(slug);

  if (!sanityArticle) {
    notFound();
  }

  const schemaMarkup = buildArticleSchema(sanityArticle, `/${pillar}/${slug}`);

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Article content */}
      <ArticleContent article={sanityArticle} />
    </>
  );
}

// Generate static params for all page specs (for static generation at build time)
export async function generateStaticParams() {
  try {
    console.log('🔍 Fetching all Sanity articles for static generation...');

    // Fetch Sanity articles
    const sanityArticles = await client.fetch<Array<{ slug: { current: string }; pillar: string }>>(
      `*[_type == "article" && defined(slug.current)]{
        slug,
        pillar
      }`
    );

    const sanityParams = sanityArticles.map(article => ({
      pillar: article.pillar || 'language-shadowing',
      slug: article.slug.current,
    }));

    console.log(`✅ Found ${sanityParams.length} Sanity articles`);
    return sanityParams;
  } catch (error) {
    console.error('❌ Error generating static params:', error);
    return [];
  }
}
