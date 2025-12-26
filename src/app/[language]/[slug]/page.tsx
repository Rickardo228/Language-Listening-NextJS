import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ListPageContent } from './ListPageContent';
import { db } from '@/lib/firestore-admin';

// Language code mapping
const LANGUAGE_MAP: Record<string, { code: string; name: string; native: string }> = {
  italian: { code: 'it-IT', name: 'Italian', native: 'Italiano' },
  spanish: { code: 'es-ES', name: 'Spanish', native: 'Español' },
  japanese: { code: 'ja-JP', name: 'Japanese', native: '日本語' },
};

// Pillar descriptions for SEO
const PILLAR_DESCRIPTIONS: Record<number, string> = {
  1: 'Master essential vocabulary and everyday expressions',
  2: 'Learn practical phrases for real-world situations',
  3: 'Communicate politely and respectfully',
  4: 'Improve your listening comprehension and speaking fluency',
  5: 'Build your foundation with the most frequently used words',
};

interface PageProps {
  params: {
    language: string;
    slug: string;
  };
}

// Revalidate pages every hour for fresh content (ISR)
export const revalidate = 3600;

// Type definitions for Firestore data
interface ListData {
  phrases: Record<string, any>;
  phraseCount?: number;
  name?: string;
  complexity?: string;
  tags?: string[];
  spoken_outcome?: string;
}

interface PageSpec {
  language?: string;
  keyword?: string;
  blocks?: Array<Record<string, any>>;
}

/**
 * Generic Firestore fetch helper to DRY up data fetching logic
 * @param fetchFn - Async function that performs the Firestore query
 * @param context - Descriptive context for logging (e.g., "template data", "page spec")
 * @returns Data from Firestore or null if not found/error
 */
async function fetchFromFirestore<T>(
  fetchFn: () => Promise<T | null>,
  context: string
): Promise<T | null> {
  try {
    console.log(`🔍 Fetching ${context}...`);
    const result = await fetchFn();

    if (result === null) {
      console.log(`⚠️ No ${context} found`);
      return null;
    }

    console.log(`✅ ${context} found`);
    return result;
  } catch (error) {
    console.error(`❌ Error fetching ${context}:`, error);
    return null;
  }
}

/**
 * Serialize Firestore data to plain objects (convert Timestamps to ISO strings)
 */
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle Firestore Timestamps
  if (data._seconds !== undefined && data._nanoseconds !== undefined) {
    return new Date(data._seconds * 1000 + data._nanoseconds / 1000000).toISOString();
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  // Handle objects
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized;
  }

  return data;
}

/**
 * Fetch list data (phrases, metadata) from templates collection
 * Uses groupId (slug) to find the template
 */
async function getListData(language: string, slug: string): Promise<ListData | null> {
  return fetchFromFirestore(async () => {
    const templatesRef = db.collection('templates');
    const snapshot = await templatesRef
      .where('groupId', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return serializeFirestoreData(data) as ListData;
  }, `template data for ${slug}`);
}

/**
 * Fetch page spec (layout, blocks, SEO) from page_specs collection
 * Document ID format: ${languageCode}_${slug} (e.g., "it-IT_common-italian-phrases")
 */
async function getPageSpec(languageCode: string, slug: string): Promise<PageSpec | null> {
  return fetchFromFirestore(async () => {
    const docId = `${languageCode}_${slug}`;
    const doc = await db.collection('page_specs').doc(docId).get();

    if (!doc.exists) return null;

    return serializeFirestoreData(doc.data()) as PageSpec;
  }, `page spec for ${languageCode}_${slug}`);
}

/**
 * Fetch both list data and page spec in parallel for efficiency
 * Returns null if either data source is missing (both required for page to render)
 */
async function getPageData(language: string, languageCode: string, slug: string) {
  const [listData, pageSpec] = await Promise.all([
    getListData(language, slug),
    getPageSpec(languageCode, slug),
  ]);

  // Both are required - return null if either is missing
  if (!listData || !pageSpec) {
    return null;
  }

  return { listData, pageSpec };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { language, slug } = await params;

  if (!LANGUAGE_MAP[language]) {
    return {
      title: 'Page Not Found',
    };
  }

  const langInfo = LANGUAGE_MAP[language];
  const keyword = slug.replace(/-/g, ' ');
  const title = keyword
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const listData = await getListData(language, slug);
  const phraseCount = listData?.phraseCount || '50+';
  const pillar = listData?.tags?.find((t: string) => t.startsWith('pillar:'))?.split(':')[1];
  const pillarDesc = pillar ? PILLAR_DESCRIPTIONS[parseInt(pillar)] : '';

  return {
    title: `${title} - ${langInfo.name} Learning | Language Shadowing`,
    description: `Learn ${phraseCount} essential ${langInfo.name} ${keyword} with AI-powered audio and shadowing practice. ${pillarDesc}. Perfect for beginners and intermediate learners.`,
    keywords: [
      keyword,
      `${langInfo.name} ${keyword}`,
      `learn ${langInfo.name}`,
      `${langInfo.name} phrases`,
      `${langInfo.name} vocabulary`,
      `${langInfo.name} pronunciation`,
      'language learning',
      'shadowing practice',
    ],
    openGraph: {
      title: `${title} - ${langInfo.name}`,
      description: `Master ${phraseCount} ${langInfo.name} ${keyword} with audio and practice exercises.`,
      type: 'article',
      locale: langInfo.code.replace('-', '_'),
    },
    alternates: {
      canonical: `/${language}/${slug}`,
    },
  };
}

// Main page component (Server-side rendered)
export default async function ListPage({ params }: PageProps) {
  const { language, slug } = await params;

  // Validate language
  if (!LANGUAGE_MAP[language]) {
    notFound();
  }

  const langInfo = LANGUAGE_MAP[language];

  // Fetch both list data and page spec in parallel
  // If either is missing, show 404 (both required for page to render)
  const pageData = await getPageData(language, langInfo.code, slug);
  if (!pageData) {
    notFound();
  }

  const { listData, pageSpec } = pageData;

  const keyword = slug.replace(/-/g, ' ');
  const title = keyword
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Extract metadata
  const phraseCount = listData.phraseCount || Object.keys(listData.phrases || {}).length;
  const complexity = listData.complexity || 'beginner';
  const tags = listData.tags || [];
  const pillar = tags.find((t: string) => t.startsWith('pillar:'))?.split(':')[1];
  const intentStage = tags.find((t: string) => t.startsWith('intent:'))?.split(':')[1] || 'beginner';
  const spokenOutcome = listData.spoken_outcome;

  // Generate schema markup
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      // ItemList schema
      {
        '@type': 'ItemList',
        name: title,
        description: `A curated list of ${phraseCount} ${langInfo.name} ${keyword} with AI-powered audio pronunciation`,
        numberOfItems: phraseCount,
        itemListElement: Object.entries(listData.phrases || {})
          .slice(0, 10)
          .map(([key, phrase]: [string, any], index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: phrase.translated || phrase.text || phrase,
            item: {
              '@type': 'AudioObject',
              name: phrase.translated || phrase.text || phrase,
              contentUrl: phrase.audioUrl,
              inLanguage: langInfo.code,
            },
          })),
      },
      // Article schema
      {
        '@type': 'Article',
        headline: title,
        description: `Learn ${phraseCount} essential ${langInfo.name} ${keyword}`,
        inLanguage: langInfo.code,
        educationalLevel: complexity,
        author: {
          '@type': 'Organization',
          name: 'Language Shadowing',
        },
      },
      // FAQ schema (will be populated by component)
      {
        '@type': 'FAQPage',
        mainEntity: [], // Will be filled by FAQs
      },
    ],
  };

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Page content (client component for audio playback) */}
      <ListPageContent
        language={language}
        langInfo={langInfo}
        slug={slug}
        title={title}
        keyword={keyword}
        listData={listData}
        pageSpec={pageSpec}
        phraseCount={phraseCount}
        complexity={complexity}
        pillar={pillar}
        intentStage={intentStage}
        spokenOutcome={spokenOutcome}
      />
    </>
  );
}

// Generate static params for all page specs (for static generation at build time)
export async function generateStaticParams() {
  try {
    console.log('🔍 Fetching all page specs for static generation...');

    const pageSpecsRef = db.collection('page_specs');
    const snapshot = await pageSpecsRef.get();

    if (snapshot.empty) {
      console.log('⚠️ No page specs found');
      return [];
    }

    // Map language codes back to route names
    const languageCodeMap: Record<string, string> = {
      'it-IT': 'italian',
      'es-ES': 'spanish',
      'ja-JP': 'japanese',
    };

    const params = snapshot.docs.map(doc => {
      // Document ID format: ${languageCode}_${slug} (e.g., "it-IT_common-italian-phrases")
      const docId = doc.id;
      const [languageCode, ...slugParts] = docId.split('_');
      const slug = slugParts.join('_'); // Handle slugs with underscores
      const language = languageCodeMap[languageCode];

      if (!language) {
        console.warn(`⚠️ Unknown language code: ${languageCode} for doc ${docId}`);
        return null;
      }

      return {
        language,
        slug,
      };
    }).filter((param): param is { language: string; slug: string } => param !== null);

    console.log(`✅ Generated ${params.length} static params for SEO`);
    return params;
  } catch (error) {
    console.error('❌ Error generating static params:', error);
    return [];
  }
}
