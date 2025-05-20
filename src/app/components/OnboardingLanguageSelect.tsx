import { languageOptions } from '../types';

interface OnboardingLanguageSelectProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
}

export function OnboardingLanguageSelect({
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
}: OnboardingLanguageSelectProps) {
    return (
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Select Your Languages</h2>
                <p className="text-muted-foreground">Choose the languages you want to practice with</p>
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Input Language</label>
                    <select
                        value={inputLang}
                        onChange={(e) => setInputLang(e.target.value)}
                        className="w-full p-2 rounded-md border bg-background"
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
                        className="w-full p-2 rounded-md border bg-background"
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