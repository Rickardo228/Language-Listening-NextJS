'use client'

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { buildTemplateUrl } from '@/app/utils/templateRoutes';

export default function TemplateDetailPage() {
    const { groupId: rawGroupId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Decode the URL-encoded groupId to handle spaces and special characters
    const groupId = rawGroupId ? decodeURIComponent(rawGroupId as string) : null;
    const initialInputLang = searchParams.get('inputLang') || 'en-GB';
    const initialTargetLang = searchParams.get('targetLang') || 'it-IT';

    // Redirect legacy query-param route to canonical path
    useEffect(() => {
        if (!groupId) return;
        const canonicalUrl = buildTemplateUrl({
            groupId,
            inputLang: initialInputLang,
            targetLang: initialTargetLang,
        });
        router.replace(canonicalUrl, { scroll: false });
    }, [groupId, initialInputLang, initialTargetLang, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
}
