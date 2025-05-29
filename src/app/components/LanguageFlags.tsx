import { getFlagEmoji } from '../utils/languageUtils';

const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
};


interface LanguageFlagsProps {
    inputLang: string;
    targetLang: string;
    className?: string;
    size?: keyof typeof sizeClasses;
}

export function LanguageFlags({ inputLang, targetLang, className = '', size = 'md' }: LanguageFlagsProps) {
    const inputFlag = getFlagEmoji(inputLang);
    const targetFlag = getFlagEmoji(targetLang);

    return (
        <span className={`flex items-center gap-1 ${sizeClasses[size]} ${className}`}>
            {inputFlag} → {targetFlag}
        </span>
    );
} 