'use client'

import TemplateDetailView from '@/app/templates/TemplateDetailView';

type TemplateDetailClientProps = {
    groupId: string | null;
    initialInputLang: string;
    initialTargetLang: string;
    autoplay: boolean;
    readOnly: boolean;
};

export default function TemplateDetailClient({
    groupId,
    initialInputLang,
    initialTargetLang,
    autoplay,
    readOnly,
}: TemplateDetailClientProps) {
    return (
        <TemplateDetailView
            groupId={groupId}
            initialInputLang={initialInputLang}
            initialTargetLang={initialTargetLang}
            autoplay={autoplay}
            readOnly={readOnly}
        />
    );
}
