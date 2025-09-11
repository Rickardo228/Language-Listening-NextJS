'use client'

import { TemplateBrowserStack } from './components/TemplateBrowserStack';

export default function Home() {
  return (
    <div className="hidden lg:block p-3 flex-grow space-y-8 max-h-full overflow-y-auto">
      <TemplateBrowserStack />
    </div>
  );
}