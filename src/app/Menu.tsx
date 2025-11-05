import { Popover } from '@headlessui/react';
import React from 'react';

export interface MenuItem {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    icon?: React.ReactNode;
    className?: string;
}

interface TriggerProps {
    className?: string;
    title?: string;
    children?: React.ReactNode;
}

interface MenuProps {
    trigger: React.ReactElement<TriggerProps>;
    items: MenuItem[];
    align?: 'left' | 'right'; // 'left' = panel left edge aligns with trigger, 'right' = panel right edge aligns with trigger
}

export function Menu({ trigger, items, align = 'left' }: MenuProps) {
    return (
        <Popover className="relative font-sans">
            <Popover.Button
                as="button"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className={trigger.props.className}
                title={trigger.props.title}
            >
                {trigger.props.children}
            </Popover.Button>
            <Popover.Panel className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-1 w-48 rounded-md shadow-lg bg-background border border-border z-[9999]`}>
                <div className="py-1">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                item.onClick(e);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2 ${item.className || ''}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            </Popover.Panel>
        </Popover>
    );
}
