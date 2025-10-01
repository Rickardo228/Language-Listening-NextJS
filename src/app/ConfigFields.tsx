// ConfigFields.tsx
import React from "react";
import { PresentationConfig } from "./types";
import { ConfigFieldDefinition } from "./configDefinitions";
import bgColorOptions from "./utils/bgColorOptions";
import { track } from "../lib/mixpanelClient";

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
        const previousValue = config[key];
        
        // Track the setting change
        track('Presentation Setting Changed', {
            settingKey: key,
            previousValue: previousValue ?? null,
            newValue: value,
            valueType: typeof value
        });
        
        setConfig({ [key]: value });
    };

    // Function to get dynamic labels based on current languages
    const getDynamicLabel = (key: keyof PresentationConfig, defaultLabel: string): string => {
        if (!inputLang || !targetLang) return defaultLabel;

        const inputLangName = getLanguageName(inputLang);
        const targetLangName = getLanguageName(targetLang);

        // Determine the first and second language based on order
        const firstLang = config.enableOutputBeforeInput ? targetLangName : inputLangName;
        const secondLang = config.enableOutputBeforeInput ? inputLangName : targetLangName;

        switch (key) {
            case 'enableInputPlayback':
                return `Play ${firstLang} Audio`;
            case 'enableInputDurationDelay':
                return `Recall - Pause after ${firstLang}`;
            case 'enableOutputDurationDelay':
                return `Shadow - Pause after ${secondLang}`;
            case 'enableOutputBeforeInput':
                return `Reverse Order (${targetLangName} → ${inputLangName})`;
            case 'showAllPhrases':
                return `Multi-Language View`;
            case 'inputPlaybackSpeed':
                return `${inputLangName} Speed`;
            case 'outputPlaybackSpeed':
                return `${targetLangName} Speed`;
            default:
                return defaultLabel;
        }
    };

    // Function to get dynamic descriptions based on current languages
    const getDynamicDescription = (key: keyof PresentationConfig, defaultDescription?: string): string => {
        if (!inputLang || !targetLang || !defaultDescription) return defaultDescription || '';

        const inputLangName = getLanguageName(inputLang);
        const targetLangName = getLanguageName(targetLang);

        // Determine the first and second language based on order
        const firstLang = config.enableOutputBeforeInput ? targetLangName : inputLangName;
        const secondLang = config.enableOutputBeforeInput ? inputLangName : targetLangName;

        switch (key) {
            case 'enableInputPlayback':
                return `Enable or disable playback of the ${firstLang} audio (recall phase) for each phrase.`;
            case 'enableInputDurationDelay':
                return `Pause after ${firstLang} to test your memory by recalling the ${secondLang} translation.`;
            case 'enableOutputDurationDelay':
                return `Pause after ${secondLang} to practice your pronunciation by repeating it.`;
            case 'enableOutputBeforeInput':
                return `Play the ${targetLangName} audio before the ${inputLangName} audio for each phrase.`;
            case 'showAllPhrases':
                return `Display ${inputLangName}, ${targetLangName}, and romanization simultaneously with highlighting for the current phase.`;
            case 'inputPlaybackSpeed':
                return `Control the playback speed of ${inputLangName} audio.`;
            case 'outputPlaybackSpeed':
                return `Control the playback speed of ${targetLangName} audio.`;
            default:
                return defaultDescription;
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
                const { key, label, inputType, description, decorator } = field;
                const value = config[key];
                const dynamicLabel = getDynamicLabel(key, label);
                const dynamicDescription = getDynamicDescription(key, description);

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
                            {dynamicDescription && (
                                <p className="text-sm text-muted-foreground mt-1">{dynamicDescription}</p>
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
                            {decorator && (
                                <div className="ml-6 mt-1">
                                    {decorator()}
                                </div>
                            )}
                            {dynamicDescription && (
                                <p className="text-sm text-muted-foreground mt-1 ml-6">{dynamicDescription}</p>
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
                            {dynamicDescription && (
                                <p className="text-sm text-muted-foreground mt-1">{dynamicDescription}</p>
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
                        {dynamicDescription && (
                            <p className="text-sm text-muted-foreground mt-1">{dynamicDescription}</p>
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
                            {dynamicDescription && (
                                <p className="text-sm text-muted-foreground mt-1">{dynamicDescription}</p>
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
                        {dynamicDescription && (
                            <p className="text-sm text-muted-foreground mt-1">{dynamicDescription}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ConfigFields;
