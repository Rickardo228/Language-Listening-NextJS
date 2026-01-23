import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './components/ui/Popover';

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
    align?: 'start' | 'end';
}

export function Menu({ trigger, items, align = 'start' }: MenuProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    className={trigger.props.className}
                    title={trigger.props.title}
                >
                    {trigger.props.children}
                </button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-48 p-1">
                {items.map((item, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            item.onClick(e);
                            setOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary rounded flex items-center gap-2 ${item.className || ''}`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
