// ConfigFields.tsx
import React from "react";
import { PresentationConfig } from "./types";
import { ConfigFieldDefinition } from "./configDefinitions";
import bgColorOptions from "./utils/bgColorOptions";

interface ConfigFieldsProps {
    definition: ConfigFieldDefinition[];
    config: PresentationConfig;
    setConfig: (newConfig: Partial<PresentationConfig>) => void;
    handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputLang?: string;
    targetLang?: string;
}

const ConfigFields: React.FC<ConfigFieldsProps> = ({
    definition,
    config,
    setConfig,
    handleImageUpload,
    inputLang,
    targetLang,
}) => {
    const handleChange = (key: keyof PresentationConfig, value: boolean | string | number) => {
        setConfig({ [key]: value });
    };

    // Function to get dynamic labels based on current languages
    const getDynamicLabel = (key: keyof PresentationConfig, defaultLabel: string): string => {
        if (!inputLang || !targetLang) return defaultLabel;

        const inputLangName = getLanguageName(inputLang);
        const targetLangName = getLanguageName(targetLang);

        switch (key) {
            case 'enableInputPlayback':
                return `Play ${inputLangName} Audio`;
            case 'enableInputDurationDelay':
                return `Recall`;
            case 'enableOutputDurationDelay':
                return `Shadow`;
            case 'enableOutputBeforeInput':
                return `Play ${targetLangName} Before ${inputLangName}`;
            case 'showAllPhrases':
                return `Show ${inputLangName} & ${targetLangName}`;
            case 'inputPlaybackSpeed':
                return `${inputLangName} Speed`;
            case 'outputPlaybackSpeed':
                return `${targetLangName} Speed`;
            default:
                return defaultLabel;
        }
    };

    // Function to get language names from language codes
    const getLanguageName = (langCode: string): string => {
        const languageMap: Record<string, string> = {
            'en-GB': 'English',
            'en-US': 'English',
            'en-AU': 'English',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'ja-JP': 'Japanese',
            'cmn-CN': 'Chinese',
            'pt-BR': 'Portuguese',
            'pt-PT': 'Portuguese',
            'el-GR': 'Greek',
            'pl-PL': 'Polish',
            'sv-SE': 'Swedish',
            'ru-RU': 'Russian',
            'hi-IN': 'Hindi',
            'ar-XA': 'Arabic',
            'bn-IN': 'Bengali',
            'id-ID': 'Indonesian',
            'ko-KR': 'Korean',
            'tr-TR': 'Turkish',
            'vi-VN': 'Vietnamese',
            'th-TH': 'Thai',
            'uk-UA': 'Ukrainian',
            'fr-CA': 'French',
            'nl-NL': 'Dutch',
            'yue-HK': 'Cantonese',
            'ta-IN': 'Tamil'
        };
        return languageMap[langCode] || langCode;
    };

    return (
        <div className="space-y-4">
            {definition.map((field) => {
                const { key, label, inputType, description } = field;
                const value = config[key];
                const dynamicLabel = getDynamicLabel(key, label);

                // Render a file input if the field is for a file (e.g. background image).
                if (inputType === "file") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label htmlFor={String(key)} className="block font-medium mb-1">
                                {dynamicLabel}
                            </label>
                            <input
                                type="file"
                                id={String(key)}
                                onChange={handleImageUpload}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    );
                }

                // Render a checkbox input.
                if (inputType === "checkbox") {
                    return (
                        <div key={key} className="flex flex-col">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={String(key)}
                                    checked={value as boolean}
                                    onChange={(e) => handleChange(key, e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor={String(key)} className="font-medium">
                                    {dynamicLabel}
                                </label>
                            </div>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1 ml-6">{description}</p>
                            )}
                        </div>
                    );
                }

                // Render a number input.
                if (inputType === "number") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label htmlFor={String(key)} className="block font-medium mb-1">
                                {dynamicLabel}
                            </label>
                            <input
                                type="number"
                                id={String(key)}
                                value={value as number}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    );
                }

                if (inputType === "color") {
                    return <div key={key} className="flex flex-col">
                        <label htmlFor={String(key)} className="block font-medium mb-1">
                            {dynamicLabel}
                        </label>
                        <input
                            list="bgColorOptions"
                            type="text"
                            id={String(key)}
                            value={value as string}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <datalist id="bgColorOptions">
                            {bgColorOptions.map((option) => (
                                <option key={option.name} value={option.value}>
                                    {option.name}
                                </option>
                            ))}
                        </datalist>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                }

                // Render a select input.
                if (inputType === "select") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label htmlFor={String(key)} className="block font-medium mb-1">
                                {dynamicLabel}
                            </label>
                            <select
                                id={String(key)}
                                value={value as number}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {field.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    );
                }

                // Render a text input (this covers text and color types, etc.)
                return (
                    <div key={key} className="flex flex-col">
                        <label htmlFor={String(key)} className="block font-medium mb-1">
                            {dynamicLabel}
                        </label>
                        <input
                            type="text"
                            id={String(key)}
                            value={value as string}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ConfigFields;
