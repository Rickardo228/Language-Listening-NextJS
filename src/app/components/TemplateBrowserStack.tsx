'use client'

import { TemplatesBrowser } from './TemplatesBrowser';
import { useUser } from '../contexts/UserContext';

interface TemplateBrowserStackProps {
    showAllOverride?: boolean;
    className?: string;
}

export function TemplateBrowserStack({
    showAllOverride = false,
    className = ''
}: TemplateBrowserStackProps) {
    const { userProfile } = useUser();

    return (
        <div className={`p-4 space-y-16 ${className}`}>
            <TemplatesBrowser
                pathId="beginner_path"
                showHeader={false}
                title="Learn the Basics"
                className="mt-2"
                noTemplatesComponent={<></>}
                showAllOverride={showAllOverride}
            />
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
