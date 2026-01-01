import { Config } from './types';
import { LanguageFlags } from './components/LanguageFlags';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export type CollectionStatus = 'not-started' | 'in-progress' | 'completed' | 'next';

interface CollectionListProps {
    savedCollections: Config[];
    onLoadCollection: (config: Config) => void;
    onRenameCollection?: (id: string) => void;
    onDeleteCollection?: (id: string) => void;
    selectedCollection?: string;
    loading?: boolean;
    title?: string | React.ReactNode;
    showAllButton?: boolean;
    onShowAllClick?: () => void;
    actionButton?: React.ReactNode;
    // Controls the presentation style of each item
    itemVariant?: 'list' | 'card';
    // Controls the flow/layout of the list container
    layout?: 'vertical' | 'horizontal';
    // Toggles display of language flags when language data is available
    showFlags?: boolean;
    // Show a play button on hover for card variant
    showPlayOnHover?: boolean;
    // Handler when the play button is clicked
    onPlayClick?: (collection: Config) => void;
    // Hide native scrollbar on horizontal layout
    hideScrollbar?: boolean;
    // Show prev/next buttons if content overflows horizontally
    enableCarouselControls?: boolean;
    getPhraseCount?: (collection: Config) => number;
    getLanguagePair?: (collection: Config) => { inputLang: string; targetLang: string } | null;
    // Optional callback to determine if a collection is completed
    getCompletionStatus?: (collection: Config) => boolean;
    // Optional callback to get detailed status (not-started, in-progress, completed, next)
    getStatus?: (collection: Config) => CollectionStatus;
    // Optional callback to provide progress for incomplete collections
    getProgressSummary?: (collection: Config) => { completedCount: number; totalCount: number } | null;
    // Optional index to scroll to (for horizontal layout)
    scrollToIndex?: number;
    // Optional scroll behavior when scrolling to index (defaults to 'smooth')
    scrollBehavior?: ScrollBehavior;
    // Optional callback to get the href for a collection (for prefetching)
    getHref?: (collection: Config) => string;
}

export function CollectionList({
    savedCollections,
    onLoadCollection,
    onRenameCollection,
    onDeleteCollection,
    selectedCollection,
    loading = false,
    title,
    showAllButton = true,
    onShowAllClick,
    actionButton,
    itemVariant = 'list',
    layout = 'vertical',
    showFlags = true,
    showPlayOnHover,
    onPlayClick,
    hideScrollbar = false,
    enableCarouselControls = false,
    getPhraseCount,
    getLanguagePair,
    getCompletionStatus,
    getStatus,
    getProgressSummary,
    scrollToIndex,
    scrollBehavior = 'smooth',
    getHref,
}: CollectionListProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = () => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        if (layout !== 'horizontal') return;
        updateScrollButtons();
        const el = containerRef.current;
        if (!el) return;
        const onScroll = () => updateScrollButtons();
        el.addEventListener('scroll', onScroll);
        const ro = new ResizeObserver(() => updateScrollButtons());
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', onScroll);
            ro.disconnect();
        };
    }, [layout, savedCollections.length]);

    // Handle scrolling to a specific index
    useEffect(() => {
        if (layout !== 'horizontal' || scrollToIndex === undefined || loading) return;
        if (scrollToIndex < 0 || scrollToIndex >= savedCollections.length) return;

        const el = containerRef.current;
        if (!el) return;

        // Wait for the DOM to be fully rendered
        const timer = setTimeout(() => {
            // Card width (220px) + gap (16px from gap-4)
            const cardWidth = 220;
            const gap = 16;
            const scrollPosition = scrollToIndex * (cardWidth + gap);

            el.scrollTo({
                left: scrollPosition,
                behavior: scrollBehavior
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [layout, scrollToIndex, savedCollections.length, loading, scrollBehavior]);

    // Deterministic hash to map collections to palette indices
    const hashStringToNumber = (value: string): number => {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            const chr = value.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    // Palette inspired by the screenshot: purple, orange, blue, red, green/purple
    // Using Tailwind arbitrary color values for precise hues
    const tileBackgroundPalette: string[] = [
        // Top Songs Global (purple)
        'bg-[#7B5CFF]',
        // Top Songs UK (orange)
        'bg-[#C47A57]',
        // Top 50 Global (teal → blue gradient)
        'bg-gradient-to-b from-[#0CA7A6] to-[#1F4DD8]',
        // Top 50 UK (red gradient)
        'bg-gradient-to-b from-[#FF4B5A] to-[#8E1E2B]',
        // Viral 50 Global (green → purple split feel)
        'bg-gradient-to-b from-[#1ED760] to-[#6D28D9]'
    ];

    const ShowAllButton = () => {
        return <button
            onClick={() => (onShowAllClick ? onShowAllClick() : router.push('/templates'))}
            className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ${layout === 'vertical' ? 'w-full' : ''} justify-center py-2`}
            title="Show all"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3 h-3"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
            </svg>
            Show all
        </button >
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {typeof title === 'string' ? (
                        <h2 className="text-xl font-semibold">{title}</h2>
                    ) : title ? (
                        <div className="text-xl font-semibold">{title}</div>
                    ) : (
                        <h2 className="text-xl font-semibold">Your Library</h2>
                    )}
                </div>
                {actionButton && (
                    <div>
                        {actionButton}
                    </div>
                )}
                {showAllButton && layout === 'horizontal' && (
                    <ShowAllButton />
                )}
            </div>
            {loading ? (
                <div
                    ref={layout === 'horizontal' ? containerRef : undefined}
                    className={
                        layout === 'horizontal'
                            ? `flex gap-4 overflow-x-auto pb-2 ${hideScrollbar ? 'no-scrollbar' : ''}`
                            : 'space-y-2'
                    }
                >
                    {Array.from({ length: layout === 'horizontal' || itemVariant === 'card' ? 6 : 8 }).map((_, index) => (
                        itemVariant === 'card' ? (
                            <div
                                key={`skeleton-card-${index}`}
                                className={`${layout === 'horizontal' ? 'min-w-[220px] max-w-[220px]' : ''}`}
                            >
                                <div className="rounded-lg h-40 border bg-secondary/40 animate-pulse" />
                                <div className="h-3 w-2/3 bg-secondary/40 rounded mt-2 animate-pulse" />
                            </div>
                        ) : (
                            <div key={`skeleton-row-${index}`} className="p-4 rounded-lg border bg-secondary/40 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="h-4 w-1/3 bg-secondary/60 rounded mb-2" />
                                        <div className="h-3 w-1/4 bg-secondary/50 rounded" />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <div className="w-4 h-4 bg-secondary/60 rounded" />
                                        <div className="w-4 h-4 bg-secondary/60 rounded" />
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : (
                <div className={layout === 'horizontal' ? 'relative' : undefined}>
                    <div
                        ref={containerRef}
                        className={
                            layout === 'horizontal'
                                ? `flex gap-4 overflow-x-auto pb-2 pr-8 ${hideScrollbar ? 'no-scrollbar' : ''}`
                                : 'space-y-2'
                        }
                    >
                        {savedCollections.map((collection) => {
                            // Determine phrase count and languages
                            const phraseCount = getPhraseCount ? getPhraseCount(collection) : collection.phrases.length;
                            const languages = getLanguagePair ? getLanguagePair(collection) : (collection.phrases[0]
                                ? { inputLang: collection.phrases[0].inputLang, targetLang: collection.phrases[0].targetLang }
                                : null);
                            const status = getStatus ? getStatus(collection) : (getCompletionStatus ? (getCompletionStatus(collection) ? 'completed' : 'not-started') : 'not-started');
                            const isCompleted = status === 'completed';
                            const isNext = status === 'next';
                            const progress = getProgressSummary
                                ? getProgressSummary(collection)
                                : null;

                            if (itemVariant === 'card') {
                                const hasBackgroundImage = Boolean(collection.presentationConfig?.bgImage);
                                const paletteIndex = tileBackgroundPalette.length
                                    ? hashStringToNumber(collection.id) % tileBackgroundPalette.length
                                    : 0;
                                const tileBackgroundClass = tileBackgroundPalette[paletteIndex] || 'bg-secondary';
                                const baseBackgroundClass =
                                    selectedCollection && selectedCollection === collection.id
                                        ? 'bg-primary text-primary-foreground'
                                        : hasBackgroundImage
                                            ? 'bg-black/40 text-white'
                                            : `${tileBackgroundClass} text-white`;
                                const href = getHref ? getHref(collection) : undefined;
                                const wrapperClassName = `group cursor-pointer transition-colors ${layout === 'horizontal' ? 'min-w-[220px] max-w-[220px]' : ''}`;

                                const cardContent = (
                                    <>
                                        <div
                                            className={
                                                `relative overflow-hidden rounded-lg p-4 h-40 flex items-end border ${baseBackgroundClass}`
                                            }
                                            style={
                                                hasBackgroundImage
                                                    ? {
                                                        backgroundImage: `url(${collection.presentationConfig?.bgImage})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {hasBackgroundImage && (
                                                <div className="pointer-events-none absolute inset-0 z-0 bg-black/35" />
                                            )}
                                            {isNext && (
                                                <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                                                    <span>Next</span>
                                                </div>
                                            )}
                                            {isCompleted && !isNext && (
                                                <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="w-3 h-3"
                                                    >
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                    <span>Completed</span>
                                                </div>
                                            )}
                                            {progress && progress.totalCount > 0 && (
                                                <div className="absolute inset-x-0 top-0 h-[3px] bg-primary/15 dark:bg-primary/25">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, (progress.completedCount / progress.totalCount) * 100))}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {(showPlayOnHover ?? true) && (
                                                <div className="absolute bottom-3 right-3 hidden sm:block z-20">
                                                    <div className="pointer-events-none absolute inset-0 rounded-full bg-white/30 blur-md opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300"></div>
                                                    <button
                                                        aria-label="Play"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onPlayClick) {
                                                                onPlayClick(collection);
                                                            } else {
                                                                onLoadCollection(collection);
                                                            }
                                                        }}
                                                        className="relative w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white/80 focus:outline-none"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                            <path d="M8 5v14l11-7L8 5z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                            <div className="w-full relative z-10">
                                                <div className="text-lg sm:text-xl font-semibold leading-tight break-words line-clamp-2 capitalize">{collection.name.replace(/_/g, ' ')}</div>
                                                {showFlags && (
                                                    <div className="text-[10px] opacity-80 tracking-wider">
                                                        {languages ? (
                                                            <LanguageFlags
                                                                inputLang={languages.inputLang}
                                                                targetLang={languages.targetLang}
                                                            />
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                            {phraseCount} phrases
                                        </p>
                                    </>
                                );

                                // const shouldPrefetch = href ? !href.startsWith('/t/') : true;
                                const shouldPrefetch = true;
                                return href ? (
                                    <Link
                                        key={collection.id}
                                        href={href}
                                        prefetch={shouldPrefetch}
                                        className={wrapperClassName}
                                        onClick={() => {
                                            // Don't preventDefault - let Link navigate naturally
                                            // Call the handler but it shouldn't call router.push since Link handles navigation
                                            onLoadCollection(collection);
                                        }}
                                    >
                                        {cardContent}
                                    </Link>
                                ) : (
                                    <div
                                        key={collection.id}
                                        className={wrapperClassName}
                                        onClick={() => onLoadCollection(collection)}
                                    >
                                        {cardContent}
                                    </div>
                                );
                            }

                            const listHref = getHref ? getHref(collection) : undefined;
                            const listClassName = `p-4 rounded-lg border cursor-pointer transition-colors ${selectedCollection && selectedCollection === collection.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background hover:bg-secondary'
                                }`;

                            const listContent = (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium truncate capitalize">{collection.name.replace(/_/g, ' ')}</h3>
                                            <p className="text-xs opacity-80 flex items-center gap-1">
                                                <span>{phraseCount} phrases</span>
                                                {showFlags && languages && (
                                                    <>
                                                        <span className="mx-1">•</span>
                                                        <LanguageFlags
                                                            inputLang={languages.inputLang}
                                                            targetLang={languages.targetLang}
                                                        />
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        {(onRenameCollection || onDeleteCollection) && (
                                            <div className="flex items-center gap-2 ml-4">
                                                {onRenameCollection && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRenameCollection(collection.id);
                                                        }}
                                                        className="p-1 rounded hover:bg-secondary"
                                                        title="Rename collection"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                                {onDeleteCollection && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteCollection(collection.id);
                                                        }}
                                                        className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground"
                                                        title="Delete collection"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1.5}
                                                            stroke="currentColor"
                                                            className="w-4 h-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            );

                            const shouldPrefetch = listHref ? !listHref.startsWith('/t/') : true;

                            return listHref ? (
                                <Link
                                    key={collection.id}
                                    href={listHref}
                                    prefetch={shouldPrefetch}
                                    className={listClassName}
                                    onClick={() => {
                                        // Don't preventDefault - let Link navigate naturally
                                        onLoadCollection(collection);
                                    }}
                                >
                                    {listContent}
                                </Link>
                            ) : (
                                <div
                                    key={collection.id}
                                    className={listClassName}
                                    onClick={() => onLoadCollection(collection)}
                                >
                                    {listContent}
                                </div>
                            );
                        })}
                    </div>
                    {layout === 'horizontal' && enableCarouselControls && (
                        <>
                            {canScrollLeft && (
                                <button
                                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 backdrop-blur border shadow hover:bg-background z-30"
                                    onClick={() => containerRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
                                    aria-label="Scroll left"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mx-auto">
                                        <path d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                            )}
                            {canScrollRight && (
                                <button
                                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 backdrop-blur border shadow hover:bg-background z-30"
                                    onClick={() => containerRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
                                    aria-label="Scroll right"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mx-auto">
                                        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
            {showAllButton && layout === 'vertical' && (
                <ShowAllButton />
            )}
        </div>
    );
} 
