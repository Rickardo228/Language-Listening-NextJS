import { defineRouting } from 'next-intl/routing';
import { languageOptions } from '@/app/types';

const locales = Array.from(
  new Set(languageOptions.map((lang) => lang.code.split('-')[0]))
);

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: true,
});
