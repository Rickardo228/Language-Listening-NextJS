import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface MenuItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
}

interface MenuProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    items: MenuItem[];
}

export function Menu({ isOpen, onClose, triggerRef, items }: MenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) return null;

    // Calculate if menu would overflow right edge
    const menuWidth = 192; // w-48 = 12rem = 192px
    const rightEdge = triggerRect.right + menuWidth;
    const viewportWidth = window.innerWidth;
    const shouldAlignRight = rightEdge > viewportWidth;

    const menuStyle = {
        position: 'fixed' as const,
        top: triggerRect.bottom,
        left: shouldAlignRight ? 'auto' : triggerRect.right,
        right: shouldAlignRight ? viewportWidth - triggerRect.right : 'auto',
    };

    return createPortal(
        <div
            ref={menuRef}
            className="w-48 rounded-md shadow-lg bg-background border border-border z-50 font-sans"
            style={menuStyle}
        >
            <div className="py-1">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2 ${item.className || ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
}
