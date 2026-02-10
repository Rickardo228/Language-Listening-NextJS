import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateBrowserStack } from '../../components/TemplateBrowserStack';
import { getTemplateBrowserStorageKey } from '../../utils/templateBrowserRecency';

// Mock UserContext
let mockUserProfile: Record<string, unknown> | null = null;
let mockUser: { uid: string } | null = null;

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
  }),
}));

vi.mock('../../components/RecentlyViewedTemplates', () => ({
  RecentlyViewedTemplates: () => null,
}));

vi.mock('../../components/UserPreferencesModal', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserPreferencesModal: ({ isOpen }: any) => (
    isOpen ? <div data-testid="user-preferences-modal">Preferences Modal</div> : null
  ),
}));

// Mock TemplatesBrowser component for simplified testing
vi.mock('../../components/TemplatesBrowser', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TemplatesBrowser: ({ title, pathId, showHeader, showAllOverride, browserId, tags, excludeTags }: any) => (
    <div
      data-testid={`template-browser-${pathId || browserId || 'no-path'}`}
      data-title={title}
      data-show-header={showHeader}
      data-show-all-override={showAllOverride}
      data-browser-id={browserId}
      data-path-id={pathId}
      data-tags={Array.isArray(tags) ? tags.join(',') : ''}
      data-exclude-tags={Array.isArray(excludeTags) ? excludeTags.join(',') : ''}
    >
      {title}
    </div>
  ),
}));

describe('TemplateBrowserStack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserProfile = null;
    mockUser = null;
    localStorage.clear();
  });

  it('renders Learn chip content by default', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    render(<TemplateBrowserStack />);

    expect(screen.getByRole('button', { name: 'Learn' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Your Learning Path')).toBeInTheDocument();
    expect(screen.getByText('New Lists')).toBeInTheDocument();
    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.queryByTestId('template-browser-news_lists')).not.toBeInTheDocument();
  });

  it('shows stories when Stories chip is selected', () => {
    mockUserProfile = { abilityLevel: 'intermediate' };

    render(<TemplateBrowserStack />);

    fireEvent.click(screen.getByRole('button', { name: 'Stories' }));

    expect(screen.getByRole('button', { name: 'Stories' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
    expect(screen.queryByText('New Lists')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommended for You')).not.toBeInTheDocument();
  });

  it('shows only news list when News chip is selected', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    render(<TemplateBrowserStack />);

    fireEvent.click(screen.getByRole('button', { name: 'News' }));

    expect(screen.getByRole('button', { name: 'News' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('template-browser-news_lists')).toBeInTheDocument();
    expect(screen.queryByText('New Lists')).not.toBeInTheDocument();
    expect(screen.queryByText('Recommended for You')).not.toBeInTheDocument();
  });

  it('passes news exclusion tag to Learn lists', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    render(<TemplateBrowserStack />);

    expect(screen.getByTestId('template-browser-new_lists')).toHaveAttribute('data-exclude-tags', 'process:news-generator');
    expect(screen.getByTestId('template-browser-recommended_for_you')).toHaveAttribute('data-exclude-tags', 'process:news-generator');
  });

  it('passes news generator include tag to News list', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    render(<TemplateBrowserStack />);

    fireEvent.click(screen.getByRole('button', { name: 'News' }));

    expect(screen.getByTestId('template-browser-news_lists')).toHaveAttribute('data-tags', 'process:news-generator');
  });

  it('keeps recency sorting for learn category', () => {
    mockUserProfile = { abilityLevel: 'beginner', preferredInputLang: 'en-GB', preferredTargetLang: 'it-IT' };
    mockUser = { uid: 'user-1' };

    const storageKey = getTemplateBrowserStorageKey({
      userId: mockUser.uid,
      inputLang: 'en-GB',
      targetLang: 'it-IT',
    });

    localStorage.setItem(
      storageKey,
      JSON.stringify(['recommended_for_you', 'beginner_path', 'new_lists'])
    );

    render(<TemplateBrowserStack />);

    const allSections = screen.getAllByTestId(/template-browser-/);
    const browserIds = allSections.map((section) => section.getAttribute('data-browser-id'));

    expect(browserIds[0]).toBe('recommended_for_you');
    expect(browserIds[1]).toBe('beginner_path');
    expect(browserIds[2]).toBe('new_lists');
  });

  it('passes showAllOverride prop to browser sections', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    render(<TemplateBrowserStack showAllOverride={true} />);

    const templateBrowsers = screen.getAllByTestId(/template-browser-/);

    templateBrowsers.forEach((browser) => {
      expect(browser.getAttribute('data-show-all-override')).toBe('true');
    });
  });

  it('applies custom className to container', () => {
    mockUserProfile = { abilityLevel: 'beginner' };

    const { container } = render(<TemplateBrowserStack className="custom-class" />);

    const stackContainer = container.firstChild as HTMLElement;
    expect(stackContainer.className).toContain('custom-class');
  });

  it('opens preferences modal when settings cog is clicked', () => {
    mockUserProfile = { abilityLevel: 'beginner' };
    mockUser = { uid: 'user-1' };

    render(<TemplateBrowserStack />);

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('user-preferences-modal')).toBeInTheDocument();
  });
});
