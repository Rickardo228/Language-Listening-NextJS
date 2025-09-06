'use client'

import { TemplatesBrowser } from './components/TemplatesBrowser';
import { useUser } from './contexts/UserContext';

export default function Home() {
  const { userProfile } = useUser();

  return (
    <div className="hidden lg:block p-3 flex-grow space-y-8">
      <TemplatesBrowser showHeader={false} />
      <TemplatesBrowser
        showHeader={false}
        title="Recommended for You"
        tags={userProfile?.contentPreferences || []}
        className="mt-8"
        noTemplatesComponent={<></>}
      />
    </div>
  );
}