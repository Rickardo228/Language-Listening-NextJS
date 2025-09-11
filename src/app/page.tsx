'use client'

import { TemplatesBrowser } from './components/TemplatesBrowser';
import { useUser } from './contexts/UserContext';

export default function Home() {
  const { userProfile } = useUser();

  return (
    <div className="hidden lg:block p-3 flex-grow space-y-8 max-h-full overflow-y-auto">
      {/* TODO - Refactor these 3 into a single component and render this on mobile too */}
      <TemplatesBrowser
        pathId="beginner_path"
        showHeader={false}
        title="Learn the Basics"
        className="mt-4"
        noTemplatesComponent={<></>}
      />
      <TemplatesBrowser
        showHeader={false}
        title="New Playlists"
      />
      <TemplatesBrowser
        showHeader={false}
        title="Recommended for You"
        tags={userProfile?.contentPreferences || []}
        noTemplatesComponent={<></>}
      />
    </div>
  );
}