import React from 'react';
import { PortableText as BasePortableText, PortableTextComponents } from '@portabletext/react';
import Link from 'next/link';
import Image from 'next/image';
import { PhraseBlock } from './PhraseBlock';
import { TemplateCta } from './TemplateCta';
import { urlFor } from '@/lib/sanity';

// Helper function to generate slug from heading text
const generateSlug = (children: any): string => {
  const text = typeof children === 'string'
    ? children
    : React.Children.toArray(children).join('');
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const buildComponents = (articleSlug?: string, hasPhrases?: boolean): PortableTextComponents => ({
  block: {
    h2: ({ children }) => {
      const id = generateSlug(children);
      return (
        <h2 id={id} className="scroll-mt-20 text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-gray-100">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = generateSlug(children);
      return (
        <h3 id={id} className="scroll-mt-20 text-2xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100">
          {children}
        </h3>
      );
    },
    h4: ({ children }) => {
      const id = generateSlug(children);
      return (
        <h4 id={id} className="scroll-mt-20 text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">
          {children}
        </h4>
      );
    },
    normal: ({ children }) => (
      <p className="text-lg leading-relaxed mb-6 text-gray-700 dark:text-gray-300">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 py-4 my-8 bg-blue-50 dark:bg-blue-900/30 italic text-gray-800 dark:text-gray-200">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700 dark:text-gray-300">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-700 dark:text-gray-300">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="ml-4">{children}</li>,
    number: ({ children }) => <li className="ml-4">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-red-600 dark:text-red-400">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href || '';

      // Anchor links (same page) - no target
      if (href.startsWith('#')) {
        return (
          <a
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            {children}
          </a>
        );
      }

      // Internal links (same site) - use Next.js Link, no target
      if (href.startsWith('/')) {
        return (
          <Link
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            {children}
          </Link>
        );
      }

      // External links - open in new tab
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        >
          {children}
        </a>
      );
    },
    internalLink: ({ children, value }) => {
      // Handle internal links to other articles
      const slug = value?.reference?.slug?.current;
      if (!slug) return <>{children}</>;

      return (
        <Link href={`/articles/${slug}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">
          {children}
        </Link>
      );
    },
  },
  types: {
    image: ({ value }: any) => {
      const source = value?.asset ? value : value?.image || value;
      if (!source) return null;

      const dimensions = value?.asset?.metadata?.dimensions;
      const width = dimensions?.width || 1200;
      const height = dimensions?.height || 675;
      const alt = value?.alt || value?.caption || 'Article image';
      const imageUrl = urlFor(source).auto('format').fit('max').width(1200).url();

      if (!imageUrl) return null;

      return (
        <figure className="my-8">
          <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            <Image
              src={imageUrl}
              alt={alt}
              width={width}
              height={height}
              sizes="(min-width: 1024px) 768px, 100vw"
              className="h-auto w-full"
            />
          </div>
          {value?.caption ? (
            <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {value.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
    phraseBlock: ({ value }: any) => (
      <PhraseBlock
        translated={value.translated}
        input={value.input}
        targetLang={value.targetLang}
        inputLang={value.inputLang}
        romanized={value.romanized}
        note={value.note}
      />
    ),
    ctaBlock: ({ value }: any) => (
      <TemplateCta
        slug={value.slug || value.templateSlug}
        inputLang={value.inputLang}
        targetLang={value.targetLang}
        heading={value.title}
        description={value.description}
        buttonText={value.buttonText}
        variant={value.variant}
        articleSlug={articleSlug}
        hasPhrases={hasPhrases}
      />
    ),
    templateCta: ({ value }: any) => (
      <TemplateCta
        templateId={value.templateId}
        inputLang={value.inputLang}
        targetLang={value.targetLang}
        heading={value.heading}
        description={value.description}
        articleSlug={articleSlug}
        hasPhrases={hasPhrases}
      />
    ),
    table: ({ value }: any) => {
      if (!value?.rows || value.rows.length === 0) return null;

      return (
        <div className="my-8 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
            <tbody>
              {value.rows.map((row: any, rowIndex: number) => {
                const isHeaderRow = row.cells?.[0]?.isHeader;
                const RowTag = isHeaderRow ? 'thead' : 'tbody';
                const CellTag = isHeaderRow ? 'th' : 'td';

                return (
                  <tr
                    key={row._key || `row-${rowIndex}`}
                    className={isHeaderRow
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                  >
                    {row.cells?.map((cell: any, cellIndex: number) => (
                      <CellTag
                        key={cell._key || `cell-${cellIndex}`}
                        className={`border border-gray-300 dark:border-gray-700 px-4 py-3 text-left ${
                          isHeaderRow
                            ? 'font-semibold text-gray-900 dark:text-gray-100'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {cell.content}
                      </CellTag>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    },
  },
});

export function PortableText({
  value,
  articleSlug,
  hasPhrases,
}: {
  value: any;
  articleSlug?: string;
  hasPhrases?: boolean;
}) {
  return <BasePortableText value={value} components={buildComponents(articleSlug, hasPhrases)} />;
}
