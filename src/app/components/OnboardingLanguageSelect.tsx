import { languageOptions } from '../types';

interface OnboardingLanguageSelectProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    disabled?: boolean;
}

export function OnboardingLanguageSelect({
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    disabled = false,
}: OnboardingLanguageSelectProps) {
    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Input Language</label>
                    <select
                        value={inputLang}
                        onChange={(e) => setInputLang(e.target.value)}
                        disabled={disabled}
                        className="w-full p-2 rounded-md border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {languageOptions.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Target Language</label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        disabled={disabled}
                        className="w-full p-2 rounded-md border bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {languageOptions.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
} 