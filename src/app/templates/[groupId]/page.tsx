'use client'

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import TemplateDetailView from '@/app/templates/TemplateDetailView';

export default function TemplateDetailPage() {
    const { groupId: rawGroupId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Decode the URL-encoded groupId to handle spaces and special characters
    const groupId = rawGroupId ? decodeURIComponent(rawGroupId as string) : null;
    const initialInputLang = searchParams.get('inputLang') || 'en-GB';
    const initialTargetLang = searchParams.get('targetLang') || 'it-IT';
    const shouldAutoplay = searchParams.get('autoplay') === '1' || searchParams.get('autoplay') === 'true';

    // Clear autoplay parameter from URL after it's been read
    useEffect(() => {
        if (!shouldAutoplay) return;
        const params = new URLSearchParams(searchParams.toString());
        params.delete('autoplay');
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
    }, [shouldAutoplay, searchParams, router]);

    return (
        <TemplateDetailView
            groupId={groupId}
            initialInputLang={initialInputLang}
            initialTargetLang={initialTargetLang}
            autoplay={shouldAutoplay}
        />
    );
}
