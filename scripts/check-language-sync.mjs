import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..", "..");
const frontendTypesPath = path.join(
  projectRoot,
  "Frontend",
  "src",
  "app",
  "types.ts"
);
const newsGeneratorPath = path.join(
  projectRoot,
  "Scheduled-Processes",
  "overnight-news-generator.js"
);

function extractCodesFromLanguageOptions(fileText) {
  const listStart = fileText.indexOf("export const languageOptions");
  if (listStart === -1) {
    throw new Error("languageOptions not found in types.ts");
  }
  const arrayStart = fileText.indexOf("[", listStart);
  const arrayEnd = fileText.indexOf("];", arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error("languageOptions array bounds not found in types.ts");
  }

  const arrayBlock = fileText.slice(arrayStart, arrayEnd);
  const codeRegex = /code:\s*"([^"]+)"/g;
  const codes = new Set();
  let match;
  while ((match = codeRegex.exec(arrayBlock)) !== null) {
    codes.add(match[1]);
  }
  return codes;
}

function extractCodesFromTopicMap(fileText) {
  const mapStart = fileText.indexOf("const topicLabelByLanguage");
  if (mapStart === -1) {
    throw new Error("topicLabelByLanguage not found in overnight-news-generator");
  }
  const braceStart = fileText.indexOf("{", mapStart);
  const braceEnd = fileText.indexOf("};", braceStart);
  if (braceStart === -1 || braceEnd === -1) {
    throw new Error("topicLabelByLanguage bounds not found");
  }

  const mapBlock = fileText.slice(braceStart, braceEnd);
  const keyRegex = /"([^"]+)":/g;
  const codes = new Set();
  let match;
  while ((match = keyRegex.exec(mapBlock)) !== null) {
    codes.add(match[1]);
  }
  return codes;
}

function readFileOrThrow(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

try {
  const typesText = readFileOrThrow(frontendTypesPath);
  const newsText = readFileOrThrow(newsGeneratorPath);

  const languageOptionCodes = extractCodesFromLanguageOptions(typesText);
  const topicMapCodes = extractCodesFromTopicMap(newsText);

  const missingInTopicMap = [...languageOptionCodes].filter(
    (code) => !topicMapCodes.has(code)
  );
  const extraInTopicMap = [...topicMapCodes].filter(
    (code) => !languageOptionCodes.has(code)
  );

  if (missingInTopicMap.length > 0 || extraInTopicMap.length > 0) {
    console.error("❌ Language sync check failed.");
    if (missingInTopicMap.length > 0) {
      console.error(
        `Missing in topicLabelByLanguage: ${missingInTopicMap
          .sort()
          .join(", ")}`
      );
    }
    if (extraInTopicMap.length > 0) {
      console.error(
        `Extra in topicLabelByLanguage: ${extraInTopicMap.sort().join(", ")}`
      );
    }
    process.exit(1);
  }

  console.log("✅ Language sync check passed.");
} catch (error) {
  console.error(`❌ Language sync check failed: ${error.message}`);
  process.exit(1);
}
