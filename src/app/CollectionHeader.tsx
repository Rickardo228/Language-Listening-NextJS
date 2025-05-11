import { Config } from './types';
import { useState, useRef } from 'react';
import { VoiceSelectionModal } from './VoiceSelectionModal';
import { MenuItem, Menu } from './Menu';

interface CollectionHeaderProps {
    collectionId: string;
    savedCollections: Config[];
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
    onVoiceChange: (inputVoice: string, targetVoice: string) => void;
    inputLang: string;
    targetLang: string;
    className?: string;
    titleClassName?: string;
}

export function CollectionHeader({
    collectionId,
    savedCollections,
    onRename,
    onDelete,
    onVoiceChange,
    inputLang,
    targetLang,
    className = "",
    titleClassName = ""
}: CollectionHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const collection = savedCollections.find(col => col.id === collectionId);
    if (!collection) return null;

    const handleVoiceSave = async (inputVoice: string, targetVoice: string) => {
        await onVoiceChange(inputVoice, targetVoice);
        setIsVoiceModalOpen(false);
    };

    const menuItems: MenuItem[] = [
        {
            label: "Rename list",
            onClick: () => onRename(collectionId),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
            )
        },
        {
            label: "Change voices",
            onClick: () => setIsVoiceModalOpen(true),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
            )
        },
        {
            label: "Delete list",
            onClick: () => onDelete(collectionId),
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            ),
            className: "text-destructive hover:bg-destructive hover:text-destructive-foreground"
        }
    ];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <h2 className={`font-semibold truncate ${titleClassName}`}>
                {collection.name}
            </h2>
            <div className="relative">
                <button
                    ref={triggerRef}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 rounded hover:bg-secondary"
                    title="List options"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                </button>
                <Menu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    triggerRef={triggerRef}
                    items={menuItems}
                />
                {isVoiceModalOpen && <VoiceSelectionModal
                    onClose={() => setIsVoiceModalOpen(false)}
                    inputLang={inputLang}
                    targetLang={targetLang}
                    onSave={handleVoiceSave}
                    phrases={collection.phrases}
                />}
            </div>
        </div>
    );
} 