import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollChevronProps {
    direction: 'left' | 'right';
    onClick: () => void;
    className?: string;
}

export function ScrollChevron({ direction, onClick, className = '' }: ScrollChevronProps) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
    const defaultPosition = direction === 'left' ? 'left-0' : 'right-0';
    const positionClass = className || defaultPosition;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`absolute ${positionClass} top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground z-30`}
            aria-label={`Scroll ${direction}`}
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
