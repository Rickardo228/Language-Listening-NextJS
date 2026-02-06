import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from '../messages/en.json';
import ptBR from '../messages/pt-BR.json';
import es from '../messages/es.json';
import de from '../messages/de.json';
import fr from '../messages/fr.json';
import nl from '../messages/nl.json';
import pl from '../messages/pl.json';
import sv from '../messages/sv.json';
import yue from '../messages/yue.json';
import vi from '../messages/vi.json';
import cmn from '../messages/cmn.json';
import ru from '../messages/ru.json';
import ar from '../messages/ar.json';

const messagesByLocale = {
  en,
  pt: ptBR,
  es,
  de,
  fr,
  nl,
  pl,
  sv,
  yue,
  vi,
  cmn,
  ru,
  ar,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale] ?? messagesByLocale.en,
  };
});
