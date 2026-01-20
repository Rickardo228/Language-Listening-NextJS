import { Phrase, TemplateDataForPhrases } from '../types';

const getLanguageNameInContext = (languageCode: string, contextLanguage: string): string => {
  try {
    const langCode = languageCode.split('-')[0];
    const displayNames = new Intl.DisplayNames([contextLanguage], { type: 'language' });
    const languageName = displayNames.of(langCode);

    return languageName || languageCode;
  } catch {
    try {
      const langCode = languageCode.split('-')[0];
      const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
      return displayNames.of(langCode) || languageCode;
    } catch {
      return languageCode;
    }
  }
};

const getRegionNameInContext = (languageCode: string, contextLanguage: string): string => {
  try {
    const parts = languageCode.split('-');
    if (parts.length < 2) {
      return languageCode;
    }

    const regionCode = parts[1];
    const displayNames = new Intl.DisplayNames([contextLanguage], { type: 'region' });
    const regionName = displayNames.of(regionCode);

    return regionName || regionCode;
  } catch {
    try {
      const parts = languageCode.split('-');
      if (parts.length < 2) {
        return languageCode;
      }

      const regionCode = parts[1];
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(regionCode) || regionCode;
    } catch {
      return languageCode;
    }
  }
};

const replaceTemplatePlaceholders = (
  text: string,
  inputLang: string,
  targetLang: string,
  contextLanguage: string
) =>
  text
    .replace(/\{targetLangName\}/g, getLanguageNameInContext(targetLang, contextLanguage))
    .replace(/\{inputLangName\}/g, getLanguageNameInContext(inputLang, contextLanguage))
    .replace(/\{targetLangRegion\}/g, getRegionNameInContext(targetLang, contextLanguage))
    .replace(/\{inputLangRegion\}/g, getRegionNameInContext(inputLang, contextLanguage));

export const buildTemplatePhrases = (
  inputTemplate: TemplateDataForPhrases,
  targetTemplate: TemplateDataForPhrases
): Phrase[] => {
  const inputPhrases = inputTemplate.phrases || {};
  const targetPhrases = targetTemplate.phrases || {};
  const createdAt =
    inputTemplate.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

  return Object.keys(inputPhrases).map((phraseKey) => {
    const inputPhrase = inputPhrases[phraseKey];
    const targetPhrase = targetPhrases[phraseKey];

    const inputText = replaceTemplatePlaceholders(
      inputPhrase?.translated || '',
      inputTemplate.lang,
      targetTemplate.lang,
      inputTemplate.lang
    );

    const translatedText = replaceTemplatePlaceholders(
      targetPhrase?.translated || '',
      inputTemplate.lang,
      targetTemplate.lang,
      targetTemplate.lang
    );

    return {
      input: inputText,
      translated: translatedText,
      inputAudio: inputPhrase?.audioUrl
        ? {
            audioUrl: inputPhrase.audioUrl,
            duration: inputPhrase.duration || 0,
          }
        : null,
      inputLang: inputTemplate.lang,
      inputVoice: inputPhrase?.voice || '',
      outputAudio: targetPhrase?.audioUrl
        ? {
            audioUrl: targetPhrase.audioUrl,
            duration: targetPhrase.duration || 0,
          }
        : null,
      targetLang: targetTemplate.lang,
      targetVoice: targetPhrase?.voice || '',
      romanized: targetPhrase?.romanized || '',
      created_at: createdAt,
    };
  });
};
