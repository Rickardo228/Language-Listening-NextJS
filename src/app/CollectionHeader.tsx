import { Config } from './types';
import { useState, useEffect } from 'react';
import { Share2, Lock, Edit, Volume2, Trash2, MoreVertical } from 'lucide-react';
import { VoiceSelectionModal } from './VoiceSelectionModal';
import { MenuItem, Menu } from './Menu';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { track } from '../lib/mixpanelClient';
import { toast } from 'sonner';

interface CollectionHeaderProps {
    collectionId: string;
    savedCollections: Config[];
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onVoiceChange?: (inputVoice: string, targetVoice: string) => void;
    onShare?: (id: string) => Promise<void>;
    onUnshare?: (id: string) => void;
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
    onShare,
    onUnshare,
    inputLang,
    targetLang,
    className = "",
    titleClassName = ""
}: CollectionHeaderProps) {
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [publishedId, setPublishedId] = useState<string | null>(null);
    const currentCollection = savedCollections.find(col => col.id === collectionId);

    useEffect(() => {
        const checkPublishedStatus = async () => {
            try {
                const sharedRef = collection(getFirestore(), 'published_collections');
                const q = query(sharedRef, where('shared_from_list', '==', collectionId));
                const querySnapshot = await getDocs(q);
                setIsPublished(!querySnapshot.empty);
                if (!querySnapshot.empty) {
                    setPublishedId(querySnapshot.docs[0].id);
                }
            } catch (err) {
                console.error('Error checking published status:', err);
            }
        };
        checkPublishedStatus();
    }, [collectionId]);


    if (!currentCollection) return null;


    const handleCopyPermalink = async () => {
        track('Collection Menu - Copy Share Link', {
            collectionId,
            collectionName: currentCollection.name,
        });
        const shareUrl = `${window.location.origin}/share/${publishedId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
    };

    const handleVoiceSave = async (inputVoice: string, targetVoice: string) => {
        if (onVoiceChange) {
            await onVoiceChange(inputVoice, targetVoice);
        }
        setIsVoiceModalOpen(false);
    };

    const handleShare = async () => {
        track('Collection Menu - Share', {
            collectionId,
            collectionName: currentCollection.name,
        });
        if (onShare) {
            await onShare(collectionId);
            setIsPublished(true);
        }
    };

    const handleUnshare = () => {
        track('Collection Menu - Unshare', {
            collectionId,
            collectionName: currentCollection.name,
        });
        if (onUnshare) {
            onUnshare(collectionId);
            setIsPublished(false);
            setPublishedId(null);
        }
    };

    const menuItems: MenuItem[] = [
        ...(onShare ? [{
            label: isPublished ? "Copy share link" : "Share with link",
            onClick: isPublished ? handleCopyPermalink : handleShare,
            icon: <Share2 className="w-4 h-4" strokeWidth={1.5} />
        }] : []),

        ...(onUnshare && isPublished ? [{
            label: "Unshare list",
            onClick: handleUnshare,
            icon: <Lock className="w-4 h-4" strokeWidth={1.5} />
        }] : []),
        ...(onRename ? [{
            label: "Rename list",
            onClick: () => {
                track('Collection Menu - Rename', {
                    collectionId,
                    collectionName: currentCollection.name,
                });
                onRename?.(collectionId);
            },
            icon: <Edit className="w-4 h-4" strokeWidth={1.5} />
        }] : []),
        ...(onVoiceChange ? [{
            label: "Change voices",
            onClick: () => {
                track('Collection Menu - Change Voices', {
                    collectionId,
                    collectionName: currentCollection.name,
                });
                setIsVoiceModalOpen(true);
            },
            icon: <Volume2 className="w-4 h-4" strokeWidth={1.5} />
        }] : []),
        ...(onDelete ? [{
            label: "Delete list",
            onClick: () => {
                track('Collection Menu - Delete', {
                    collectionId,
                    collectionName: currentCollection.name,
                });
                onDelete?.(collectionId);
            },
            icon: <Trash2 className="w-4 h-4" strokeWidth={1.5} />,
            className: "text-destructive hover:bg-destructive hover:text-destructive-foreground"
        }] : [])
    ];

    // Only show the options button if there are menu items to display
    const hasMenuItems = menuItems.length > 0;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <h2 className={`font-semibold truncate capitalize ${titleClassName}`}>
                {currentCollection.name}
            </h2>
            {hasMenuItems && (
                <Menu
                    trigger={
                        <button
                            className="p-1 rounded hover:bg-secondary"
                            title="List options"
                        >
                            <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    }
                    items={menuItems}
                />
            )}
            {onVoiceChange && <VoiceSelectionModal
                isOpen={isVoiceModalOpen}
                onClose={() => setIsVoiceModalOpen(false)}
                inputLang={inputLang}
                targetLang={targetLang}
                onSave={handleVoiceSave}
                phrases={currentCollection.phrases}
            />}
        </div>
    );
} 