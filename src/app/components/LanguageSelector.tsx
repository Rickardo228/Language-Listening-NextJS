'use client'

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { languageOptions } from '../types';
import { LanguageFlags } from './LanguageFlags';

type Direction = 'row' | 'column';
type Mode = 'editable' | 'locked';
type Gap = 'sm' | 'md' | 'lg';

interface LanguageSelectorProps {
    inputLang: string;
    setInputLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    direction?: Direction;
    mode?: Mode;
    disabled?: boolean;
    inputLabel?: string;
    targetLabel?: string;
    gap?: Gap;
    className?: string;
    selectClassName?: string;
    // Locked mode specific props
    isSwapped?: boolean;
    onSwap?: () => void;
}

const gapClasses: Record<Gap, string> = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
};

const columnGapClasses: Record<Gap, string> = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-6'
};

export function LanguageSelector({
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    direction = 'row',
    mode = 'editable',
    disabled = false,
    inputLabel = 'Input Language',
    targetLabel = 'Target Language',
    gap = 'md',
    className = '',
    selectClassName = '',
    isSwapped,
    onSwap,
}: LanguageSelectorProps) {
    const [internalSwapped, setInternalSwapped] = useState(false);

    // Locked mode with swap functionality
    if (mode === 'locked') {
        // Use external swap state if provided, otherwise use internal state
        const swapped = isSwapped !== undefined ? isSwapped : internalSwapped;

        const handleSwap = () => {
            if (onSwap) {
                // Use external swap handler if provided
                onSwap();
            } else {
                // Fall back to swapping parent state directly
                const tempInput = inputLang;
                setInputLang(targetLang);
                setTargetLang(tempInput);
                setInternalSwapped(!internalSwapped);
            }
        };

        return (
            <div className={`flex ${gapClasses.sm} ${className}`}>
                <LanguageFlags
                    inputLang={swapped ? targetLang : inputLang}
                    targetLang={swapped ? inputLang : targetLang}
                    size="xl"
                />
                <button
                    onClick={handleSwap}
                    className="p-2 rounded-md border bg-background hover:bg-secondary"
                    title="Swap languages"
                    disabled={disabled}
                >
                    <ArrowLeftRight className="w-5 h-5" strokeWidth={1.5} />
                </button>
            </div>
        );
    }

    // Editable mode
    const containerClasses = direction === 'row'
        ? `flex ${gapClasses[gap]}`
        : columnGapClasses[gap];

    const itemClasses = direction === 'row' ? 'flex-1' : 'w-full';

    const defaultSelectClasses = selectClassName || (
        direction === 'row'
            ? 'w-full p-2 rounded-md border bg-background disabled:opacity-50 disabled:cursor-not-allowed'
            : 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
    );

    const labelClasses = direction === 'row'
        ? 'block text-sm font-medium mb-1'
        : 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

    // Swap button for editable mode (if onSwap is provided)
    const swapButton = onSwap && direction === 'row' ? (
        <div className="flex flex-col justify-end">
            <div className={labelClasses}>&nbsp;</div>
            <button
                onClick={onSwap}
                className="p-2 rounded-md border bg-background hover:bg-secondary"
                title="Swap languages"
                disabled={disabled}
            >
                <ArrowLeftRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
        </div>
    ) : null;

    return (
        <div className={`${containerClasses} ${className}`}>
            <div className={itemClasses}>
                <label className={labelClasses}>
                    {inputLabel}
                </label>
                <select
                    value={inputLang}
                    onChange={(e) => setInputLang(e.target.value)}
                    disabled={disabled}
                    className={defaultSelectClasses}
                >
                    {languageOptions.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>

            {swapButton}

            <div className={itemClasses}>
                <label className={labelClasses}>
                    {targetLabel}
                </label>
                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    disabled={disabled}
                    className={defaultSelectClasses}
                >
                    {languageOptions.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
