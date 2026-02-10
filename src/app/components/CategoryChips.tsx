'use client'

import { type LucideIcon } from 'lucide-react';
import { useScrollControls } from '../hooks/useScrollControls';
import { ScrollChevron } from './ScrollChevron';

interface CategoryChip<T extends string> {
    id: T;
    label: string;
    icon: LucideIcon;
}

interface CategoryChipsProps<T extends string> {
    chips: Array<CategoryChip<T>>;
    activeCategory: T;
    onCategoryChange: (category: T) => void;
}

export function CategoryChips<T extends string>({
    chips,
    activeCategory,
    onCategoryChange,
}: CategoryChipsProps<T>) {
    const { containerRef, canScrollLeft, canScrollRight, scrollLeft, scrollRight, hasOverflow } = useScrollControls({
        scrollAmount: 200,
    });

    return (
        <div className="relative flex-1 min-w-0">
            <div
                ref={containerRef}
                className={[
                    'flex items-center gap-2 overflow-x-auto scrollbar-hide',
                    hasOverflow && 'px-10'
                ].filter(Boolean).join(' ')}
            >
                {chips.map((chip) => {
                    const isActive = activeCategory === chip.id;
                    const Icon = chip.icon;
                    return (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => onCategoryChange(chip.id)}
                            className={[
                                'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                                isActive
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                            ].join(' ')}
                            aria-pressed={isActive}
                        >
                            <Icon className="h-4 w-4" />
                            {chip.label}
                        </button>
                    );
                })}
            </div>
            {canScrollLeft && (
                <>
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                    <ScrollChevron direction="left" onClick={scrollLeft} />
                </>
            )}
            {canScrollRight && (
                <>
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                    <ScrollChevron direction="right" onClick={scrollRight} />
                </>
            )}
        </div>
    );
}
