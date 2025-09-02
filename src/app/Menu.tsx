import { Popover } from '@headlessui/react';

export interface MenuItem {
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    icon?: React.ReactNode;
    className?: string;
}

interface MenuProps {
    trigger: React.ReactElement;
    items: MenuItem[];
}

export function Menu({ trigger, items }: MenuProps) {
    return (
        <Popover className="relative font-sans">
            <Popover.Button as="div">{trigger}</Popover.Button>
            <Popover.Panel className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-background border border-border z-50">
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
