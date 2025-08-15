import { TemplatesBrowser } from './components/TemplatesBrowser';

export default function Home() {
  return (
    <div className="hidden lg:block p-3 flex-grow">
      <TemplatesBrowser showHeader={false} />
    </div>
  );
}