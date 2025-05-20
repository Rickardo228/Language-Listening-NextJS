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
