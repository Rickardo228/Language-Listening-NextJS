'use client'

import { useParams, useSearchParams } from 'next/navigation';
import TemplateDetailView from '@/app/(app)/templates/TemplateDetailView';

export default function PublicTemplatePage() {
    const { groupId, inputLang, targetLang } = useParams();
    const searchParams = useSearchParams();
    const shouldAutoplay = searchParams.get('autoplay') === '1' || searchParams.get('autoplay') === 'true';

    const decodedGroupId = groupId ? decodeURIComponent(groupId as string) : null;
    const decodedInputLang = inputLang ? decodeURIComponent(inputLang as string) : 'en-GB';
    const decodedTargetLang = targetLang ? decodeURIComponent(targetLang as string) : 'it-IT';

    return (
        <TemplateDetailView
            groupId={decodedGroupId}
            initialInputLang={decodedInputLang}
            initialTargetLang={decodedTargetLang}
            autoplay={shouldAutoplay}
            readOnly={true}
        />
    );
}
