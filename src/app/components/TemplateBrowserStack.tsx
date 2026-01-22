'use client'

import { useMemo, useRef } from 'react';
import { TemplatesBrowser } from './TemplatesBrowser';
import { useUser } from '../contexts/UserContext';
import { getRecommendedPaths } from '../utils/contentRecommendations';
import {
    DEFAULT_INPUT_LANG,
    DEFAULT_TARGET_LANG,
    getRecentTemplateBrowserIds,
} from '../utils/templateBrowserRecency';

interface TemplateBrowserStackProps {
    showAllOverride?: boolean;
    className?: string;
}

export function TemplateBrowserStack({
    showAllOverride = false,
    className = ''
}: TemplateBrowserStackProps) {
    const { user, userProfile } = useUser();

    const learningPaths = getRecommendedPaths(userProfile?.abilityLevel);
    const inputLang = userProfile?.preferredInputLang || DEFAULT_INPUT_LANG;
    const targetLang = userProfile?.preferredTargetLang || DEFAULT_TARGET_LANG;
    const shouldUseRecencyRef = useRef<boolean | null>(null);
    if (shouldUseRecencyRef.current === null) {
        shouldUseRecencyRef.current = Boolean(user?.uid && userProfile);
    }
    const shouldUseRecency = shouldUseRecencyRef.current;
    const recentBrowserIds = useMemo(
        () =>
            shouldUseRecency
                ? getRecentTemplateBrowserIds({ userId: user?.uid, inputLang, targetLang })
                : [],
        [shouldUseRecency, user?.uid, inputLang, targetLang]
    );

    const recentOrderMap = new Map(
        recentBrowserIds.map((id, index) => [id, index])
    );

    const defaultBrowsers = [
        {
            id: 'new_lists',
            element: (
                <TemplatesBrowser
                    key="new_lists"
                    showHeader={false}
                    title="New Lists"
                    showAllOverride={showAllOverride}
                    browserId="new_lists"
                />
            ),
        },
        ...learningPaths.map((path) => ({
            id: path.id,
            element: (
                <TemplatesBrowser
                    key={path.id}
                    pathId={path.pathId}
                    showHeader={false}
                    title={path.title}
                    className="mt-2"
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                    browserId={path.id}
                />
            ),
        })),
        {
            id: 'recommended_for_you',
            element: (
                <TemplatesBrowser
                    key="recommended_for_you"
                    showHeader={false}
                    title="Recommended for You"
                    tags={userProfile?.contentPreferences || []}
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                    browserId="recommended_for_you"
                />
            ),
        },
    ];

    const sortedBrowsers = defaultBrowsers
        .map((browser, defaultIndex) => ({
            ...browser,
            defaultIndex,
            recentIndex: recentOrderMap.get(browser.id),
        }))
        .sort((a, b) => {
            const aRecent = a.recentIndex;
            const bRecent = b.recentIndex;

            if (aRecent == null && bRecent == null) {
                return a.defaultIndex - b.defaultIndex;
            }

            if (aRecent == null) return 1;
            if (bRecent == null) return -1;

            return aRecent - bRecent;
        })
        .map((browser) => browser.element);

    return (
        <div className={`p-4 space-y-16 ${className}`}>
            {sortedBrowsers}
        </div>
    );
}
