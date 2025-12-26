import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firestore-admin';

// Language code mapping
const LANGUAGE_MAP: Record<string, { code: string; name: string; native: string }> = {
  italian: { code: 'it-IT', name: 'Italian', native: 'Italiano' },
  spanish: { code: 'es-ES', name: 'Spanish', native: 'Español' },
  japanese: { code: 'ja-JP', name: 'Japanese', native: '日本語' },
};

// Pillar names
const PILLAR_NAMES: Record<string, string> = {
  '1': 'Core Communication',
  '2': 'Situational Communication',
  '3': 'Politeness & Social Safety',
  '4': 'Real-World Listening & Speaking',
  '5': 'High-Value Vocabulary',
};

interface PageProps {
  params: {
    language: string;
  };
}

interface Template {
  id: string;
  groupId: string;
  name: string;
  canonicalSlug: string;
  phraseCount: number;
  complexity: string;
  pillar: string;
  tags: string[];
}

// Fetch all SEO content for a language (directly from Firestore)
async function getLanguageContent(languageCode: string) {
  try {
    console.log('📡 Fetching page specs for language:', languageCode);

    // Query page_specs collection by language
    const pageSpecsRef = db.collection('page_specs');
    const snapshot = await pageSpecsRef
      .where('language', '==', languageCode)
      .limit(100)
      .get();

    console.log('📦 Query results:', {
      isEmpty: snapshot.empty,
      docsCount: snapshot.docs.length,
    });

    if (snapshot.empty) {
      console.log('⚠️ No page specs found for language:', languageCode);
      return { language: languageCode, count: 0, templates: [] };
    }

    console.log(`📄 Processing ${snapshot.docs.length} documents...`);

    // Sort docs by createdAt in memory (since we can't use orderBy without index)
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis?.() || 0;
      const bTime = b.data().createdAt?.toMillis?.() || 0;
      return bTime - aTime; // desc order
    });

    // Transform page specs to template format
    const templates: Template[] = sortedDocs.map(doc => {
      const data = doc.data();
      const slug = data.keyword?.toLowerCase().replace(/\s+/g, '-') || doc.id;

      console.log(`  📝 Document ${doc.id}:`, {
        keyword: data.keyword,
        slug: slug,
        language: data.language,
        hasBlocks: !!data.blocks,
      });

      // Extract metadata from blocks or top-level fields
      const categoryBlocks = data.blocks?.filter((b: any) => b.type === 'category_section') || [];
      const totalPhrases = categoryBlocks.reduce((sum: number, block: any) =>
        sum + (block.phrases?.length || 0), 0
      );

      return {
        id: doc.id,
        groupId: slug,
        name: data.keyword || data.title || slug,
        canonicalSlug: slug,
        phraseCount: totalPhrases || data.phraseCount || 0,
        complexity: data.complexity || 'beginner',
        pillar: data.pillar?.toString() || '1',
        tags: data.tags || [],
      };
    });

    console.log('✅ Found page specs:', {
      language: languageCode,
      count: templates.length,
      templates: templates.map(t => ({ slug: t.canonicalSlug, name: t.name })),
    });

    return {
      language: languageCode,
      count: templates.length,
      templates,
    };
  } catch (error) {
    console.error('❌ Error fetching language content:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { language } = await params;

  if (!LANGUAGE_MAP[language]) {
    return {
      title: 'Page Not Found',
    };
  }

  const langInfo = LANGUAGE_MAP[language];
  const data = await getLanguageContent(langInfo.code);
  const count = data?.count || 0;

  return {
    title: `Learn ${langInfo.name} - ${count}+ Free Lists | Language Shadowing`,
    description: `Discover ${count}+ free ${langInfo.name} vocabulary and phrase lists with audio pronunciation. Master essential words, phrases, and expressions through shadowing practice.`,
    keywords: [
      `learn ${langInfo.name}`,
      `${langInfo.name} vocabulary`,
      `${langInfo.name} phrases`,
      `${langInfo.name} pronunciation`,
      `${langInfo.name} for beginners`,
      'language learning',
      'shadowing practice',
    ],
    openGraph: {
      title: `Learn ${langInfo.name} - Free Lists with Audio`,
      description: `${count}+ free ${langInfo.name} lists with pronunciation guides and shadowing practice.`,
      type: 'website',
      locale: langInfo.code.replace('-', '_'),
    },
    alternates: {
      canonical: `/${language}`,
    },
  };
}

// Main hub page component
export default async function LanguageHubPage({ params }: PageProps) {
  const { language } = await params;

  console.log('🚀 LanguageHubPage called with language:', language);

  // Validate language
  if (!LANGUAGE_MAP[language]) {
    console.log('❌ Invalid language:', language);
    notFound();
  }

  const langInfo = LANGUAGE_MAP[language];
  console.log('✅ Language info:', langInfo);
  console.log('🔍 Fetching content for language code:', langInfo.code);

  const data = await getLanguageContent(langInfo.code);
  console.log('📊 Content data received:', {
    hasData: !!data,
    count: data?.count,
    templatesLength: data?.templates?.length,
  });

  if (!data || data.count === 0) {
    console.log('⚠️ No content available - showing empty state');
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">
            Learn {langInfo.name}
          </h1>
          <p className="text-muted-foreground mb-8">
            No content available yet. Check back soon!
          </p>
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const templates: Template[] = data.templates;
  console.log('🎨 Rendering page with templates:', templates.length);

  // Group templates by pillar
  const byPillar: Record<string, Template[]> = {};
  templates.forEach(template => {
    const pillar = template.pillar || '1';
    if (!byPillar[pillar]) {
      byPillar[pillar] = [];
    }
    byPillar[pillar].push(template);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Learn {langInfo.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            {data.count} free lists with audio pronunciation and shadowing practice
          </p>
          <p className="text-muted-foreground">
            Master essential vocabulary, phrases, and expressions with AI-powered audio.
          </p>
        </div>

        {/* Content grouped by pillar */}
        {Object.entries(byPillar)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([pillar, pillarTemplates]) => (
            <div key={pillar} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">
                {PILLAR_NAMES[pillar] || `Pillar ${pillar}`}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pillarTemplates.map(template => (
                  <Link
                    key={template.id}
                    href={`/${language}/${template.canonicalSlug}`}
                    className="block p-6 rounded-lg border border-border hover:border-primary transition-colors bg-card"
                  >
                    <h3 className="text-lg font-semibold mb-2 capitalize">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{template.phraseCount} phrases</span>
                      <span className="capitalize">{template.complexity}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center">
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Generate static params for known languages (optional)
export async function generateStaticParams() {
  return [
    { language: 'italian' },
    { language: 'spanish' },
    { language: 'japanese' },
  ];
}
