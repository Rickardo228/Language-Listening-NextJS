import TemplateDetailClient from './template-detail-client';

type PageProps = {
    params: {
        groupId: string;
        inputLang: string;
        targetLang: string;
    };
    searchParams?: {
        autoplay?: string | string[];
    };
};

const LOADING_DELAY_MS = 400;

export default async function PublicTemplatePage({ params, searchParams }: PageProps) {
    const decodedGroupId = params.groupId ? decodeURIComponent(params.groupId) : null;
    const decodedInputLang = params.inputLang ? decodeURIComponent(params.inputLang) : 'en-GB';
    const decodedTargetLang = params.targetLang ? decodeURIComponent(params.targetLang) : 'it-IT';
    const autoplayParam = searchParams?.autoplay;
    const shouldAutoplay = Array.isArray(autoplayParam)
        ? autoplayParam.includes('1') || autoplayParam.includes('true')
        : autoplayParam === '1' || autoplayParam === 'true';

    await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY_MS));

    return (
        <TemplateDetailClient
            groupId={decodedGroupId}
            initialInputLang={decodedInputLang}
            initialTargetLang={decodedTargetLang}
            autoplay={shouldAutoplay}
            readOnly={true}
        />
    );
}
