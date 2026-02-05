import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import {
  ArticleContent,
  buildArticleMetadata,
  buildArticleSchema,
  getSanityArticle,
} from './articleUtils';

interface PageProps {
  params: {
    pillar: string;
  };
}

// Revalidate pages every hour for fresh content (ISR)
export const revalidate = 3600;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pillar } = await params;

  const sanityArticle = await getSanityArticle(pillar);
  if (sanityArticle) {
    return buildArticleMetadata(sanityArticle, `/${pillar}`);
  }

  return {
    title: 'Page Not Found',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PillarPage({ params }: PageProps) {
  const { pillar } = await params;

  const sanityArticle = await getSanityArticle(pillar);
  if (!sanityArticle) {
    notFound();
  }

  const schemaMarkup = buildArticleSchema(sanityArticle, `/${pillar}`);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <ArticleContent article={sanityArticle} />
    </>
  );
}

export async function generateStaticParams() {
  try {
    console.log('🔍 Fetching Sanity pillar pages for static generation...');

    const sanityPillars = await client.fetch<Array<{ slug: { current: string } }>>(
      `*[_type == "article" && defined(slug.current) && slug.current == pillar]{
        slug
      }`
    );

    console.log(`✅ Found ${sanityPillars.length} Sanity pillar pages`);

    return sanityPillars.map(article => ({
      pillar: article.slug.current,
    }));
  } catch (error) {
    console.error('❌ Error generating static params:', error);
    return [];
  }
}
