import { useEffect, useRef, useState, useCallback } from 'react';

interface UseScrollControlsOptions {
    scrollAmount?: number;
    deps?: any[]; // Optional dependencies to force re-setup
}

export function useScrollControls(options: UseScrollControlsOptions = {}) {
    const { scrollAmount = 200, deps = [] } = options;
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateScrollState = () => {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        };

        // Initial state check
        updateScrollState();

        const handleScroll = () => {
            updateScrollState();
        };

        container.addEventListener('scroll', handleScroll);

        const resizeObserver = new ResizeObserver(() => {
            updateScrollState();
        });
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, deps); // Re-run when deps change (e.g., loading state)

    const scrollLeft = useCallback(() => {
        containerRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }, [scrollAmount]);

    const scrollRight = useCallback(() => {
        containerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }, [scrollAmount]);

    return {
        containerRef,
        canScrollLeft,
        canScrollRight,
        scrollLeft,
        scrollRight,
        hasOverflow: canScrollLeft || canScrollRight,
    };
}
