'use client';

import React from 'react';
import Link from 'next/link';

interface TemplateCtaProps {
  slug?: string;
  templateId?: string;
  inputLang?: string;
  targetLang?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  articleSlug?: string;
}

export function TemplateCta({
  slug,
  templateId,
  inputLang = 'en-US',
  targetLang = 'en-US',
  heading = 'Ready to Practice?',
  description = 'Try this shadowing exercise on LanguageShadowing.com',
  buttonText = 'Practice Now',
  variant = 'primary',
  articleSlug,
}: TemplateCtaProps) {
  const resolvedSlug = slug || templateId || articleSlug;
  if (!resolvedSlug) return null;

  const templateUrl = `https://languageshadowing.com/t/${resolvedSlug}/${inputLang}/${targetLang}`;
  const variantClasses =
    variant === 'secondary'
      ? 'from-gray-50 to-gray-100 border-gray-200 dark:from-gray-900/20 dark:to-gray-800/30 dark:border-gray-700'
      : variant === 'accent'
        ? 'from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700'
        : 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700';

  return (
    <div className={`my-8 p-6 bg-gradient-to-br border-2 rounded-lg shadow-md ${variantClasses}`}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {heading}
          </h3>
          {description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {description}
            </p>
          )}
        </div>

        <Link
          href={templateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <span>{buttonText}</span>
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Practice with AI-powered audio and interactive exercises
        </p>
      </div>
    </div>
  );
}
