/**
 * Converts a language code to its corresponding flag emoji
 * @param languageCode - The language code (e.g., "en-US")
 * @returns The flag emoji for the country code, or 🌐 if no country code is found
 */
export function getFlagEmoji(languageCode: string): string {
  // Extract the country code from the language code (e.g., "en-US" -> "US")
  const countryCode = languageCode.split("-")[1];
  if (!countryCode) return "🌐";

  // Convert country code to regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Converts a language code to its human-readable name
 * @param languageCode - The language code (e.g., "it-IT", "en-GB")
 * @returns The human-readable language name
 */
export function getLanguageName(languageCode: string): string {
  const languageMap: Record<string, string> = {
    "en-GB": "English (UK)",
    "en-US": "English (US)",
    "en-AU": "English (Australia)",
    en: "English",
    uk: "English",
    "es-ES": "Spanish",
    es: "Spanish",
    "fr-FR": "French",
    fr: "French",
    "de-DE": "German",
    de: "German",
    "it-IT": "Italian",
    it: "Italian",
    "ja-JP": "Japanese",
    ja: "Japanese",
    "cmn-CN": "Chinese",
    zh: "Chinese",
    "zh-CN": "Chinese",
    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",
    pt: "Portuguese",
    "el-GR": "Greek",
    el: "Greek",
    "pl-PL": "Polish",
    pl: "Polish",
    "sv-SE": "Swedish",
    sv: "Swedish",
    "ru-RU": "Russian",
    ru: "Russian",
    "hi-IN": "Hindi",
    hi: "Hindi",
    "ar-XA": "Arabic",
    ar: "Arabic",
    "bn-IN": "Bengali",
    bn: "Bengali",
    "id-ID": "Indonesian",
    id: "Indonesian",
    "ko-KR": "Korean",
    ko: "Korean",
    "tr-TR": "Turkish",
    tr: "Turkish",
    "vi-VN": "Vietnamese",
    vi: "Vietnamese",
    "th-TH": "Thai",
    th: "Thai",
    "uk-UA": "Ukrainian",
    ukr: "Ukrainian",
    "fr-CA": "French (Canada)",
    "nl-NL": "Dutch",
    nl: "Dutch",
    "yue-HK": "Cantonese",
    "ta-IN": "Tamil",
    ta: "Tamil",
  };

  return languageMap[languageCode] || languageCode;
}
