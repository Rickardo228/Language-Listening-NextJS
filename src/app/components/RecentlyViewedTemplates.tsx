'use client'

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getRecentTemplates } from '../utils/progressService';
import { TemplatesBrowser } from './TemplatesBrowser';

interface RecentlyViewedTemplatesProps {
    className?: string;
    limit?: number;
}

export function RecentlyViewedTemplates({
    className = '',
    limit = 15
}: RecentlyViewedTemplatesProps) {
    const { user, userProfile } = useUser();
    const [recentGroupIds, setRecentGroupIds] = useState<string[]>([]);

    const inputLang = userProfile?.preferredInputLang || 'en-GB';
    const targetLang = userProfile?.preferredTargetLang || 'it-IT';

    useEffect(() => {
        async function fetchRecentGroupIds() {
            if (!user?.uid) {
                return;
            }

            try {
                // Get recent template IDs from progress collection
                const recentProgress = await getRecentTemplates(user.uid, limit * 2);

                // Filter to only templates matching user's language preferences and extract groupIds
                const filteredProgress = recentProgress
                    .filter(p =>
                        p.itemType === 'template' &&
                        p.inputLang === inputLang &&
                        p.targetLang === targetLang
                    )
                    .map(p => {
                        // Parse collectionId from the progress data
                        // collectionId might be stored directly, or we need to extract from itemId
                        let collectionId = p.collectionId;
                        if (!collectionId) {
                            // Fallback: extract from document structure or use groupId if available
                            console.warn('[RecentlyViewed] Missing collectionId for progress item:', p);
                        }
                        return collectionId;
                    })
                    .filter((id): id is string => !!id)
                    .slice(0, limit);

                // Extract unique collection IDs (which are groupIds)
                const groupIds = [...new Set(filteredProgress)];
                setRecentGroupIds(groupIds);
            } catch (error) {
                console.error('[RecentlyViewed] Error fetching recent templates:', error);
            }
        }

        fetchRecentGroupIds();
    }, [user?.uid, limit, inputLang, targetLang]);

    if (!user?.uid || recentGroupIds.length === 0) {
        return null;
    }

    return (
        <TemplatesBrowser
            showHeader={false}
            title={
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <History className="w-5 h-5" />
                    <span>Recently Viewed</span>
                </h2>
            }
            className={className}
            noTemplatesComponent={<></>}
            groupIdQueryOverride={recentGroupIds}
        />
    );
}
