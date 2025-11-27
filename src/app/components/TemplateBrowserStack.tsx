'use client'

import { TemplatesBrowser } from './TemplatesBrowser';
import { useUser } from '../contexts/UserContext';
import { getRecommendedPaths } from '../utils/contentRecommendations';

interface TemplateBrowserStackProps {
    showAllOverride?: boolean;
    className?: string;
}

export function TemplateBrowserStack({
    showAllOverride = false,
    className = ''
}: TemplateBrowserStackProps) {
    const { userProfile } = useUser();

    const learningPaths = getRecommendedPaths(userProfile?.abilityLevel);

    return (
        <div className={`p-4 space-y-16 ${className}`}>
            {learningPaths.map(path => (
                <TemplatesBrowser
                    key={path.id}
                    pathId={path.pathId}
                    showHeader={false}
                    title={path.title}
                    className="mt-2"
                    noTemplatesComponent={<></>}
                    showAllOverride={showAllOverride}
                />
            ))}
            <TemplatesBrowser
                showHeader={false}
                title="New Playlists"
                showAllOverride={showAllOverride}
            />
            <TemplatesBrowser
                showHeader={false}
                title="Recommended for You"
                tags={userProfile?.contentPreferences || []}
                noTemplatesComponent={<></>}
                showAllOverride={showAllOverride}
            />
        </div>
    );
}
