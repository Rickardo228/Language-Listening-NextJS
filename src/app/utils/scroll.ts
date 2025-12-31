export const resetMainScroll = () => {
    if (typeof window === 'undefined') return;

    const scrollingElement = document.scrollingElement;
    if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
        return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};
