'use client'

import { TemplatesBrowser } from './components/TemplatesBrowser';
import { useUser } from './contexts/UserContext';

export default function Home() {
  const { userProfile } = useUser();

  return (
    <div className="hidden lg:block p-3 flex-grow space-y-8">
      <TemplatesBrowser
        showHeader={false}
        title="General Templates"
      />
      <TemplatesBrowser
        showHeader={false}
        title="Recommended for You"
        tags={userProfile?.contentPreferences || []}
        className="mt-8"
        noTemplatesComponent={<></>}
      />
      <TemplatesBrowser
        pathId="beginner_path"
        showHeader={false}
        title="Beginner Learning Path"
        className="mt-8"
        noTemplatesComponent={<></>}
      />
    </div>
  );
}