import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplateBrowserStack } from '../../components/TemplateBrowserStack';
import { getTemplateBrowserStorageKey } from '../../utils/templateBrowserRecency';
import { UserProfile } from 'firebase/auth';

// Mock UserContext
let mockUserProfile: UserProfile | null = null;
let mockUser: { uid: string } | null = null;

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
  }),
}));

// Mock TemplatesBrowser component for simplified testing
vi.mock('../../components/TemplatesBrowser', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TemplatesBrowser: ({ title, pathId, showHeader, showAllOverride, browserId }: any) => (
    <div
      data-testid={`template-browser-${pathId || 'no-path'}`}
      data-title={title}
      data-show-header={showHeader}
      data-show-all-override={showAllOverride}
      data-browser-id={browserId}
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

  describe('Ability level filtering - Beginner users', () => {
    it('should render "Learn the Basics" path for beginner users', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Learn the Basics')).toBeInTheDocument();
      expect(screen.getByTestId('template-browser-beginner_path')).toBeInTheDocument();
    });

    it('should NOT render "Skyward Gate" path for beginner users', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack />);

      expect(screen.queryByText('Skyward Gate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('template-browser-skyward_gate_path')).not.toBeInTheDocument();
    });

    it('should render static sections for beginner users', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('New Lists')).toBeInTheDocument();
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });
  });

  describe('Ability level filtering - Elementary users', () => {
    it('should render "Learn the Basics" path for elementary users', () => {
      mockUserProfile = { abilityLevel: 'elementary' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Learn the Basics')).toBeInTheDocument();
    });

    it('should NOT render "Skyward Gate" path for elementary users', () => {
      mockUserProfile = { abilityLevel: 'elementary' };

      render(<TemplateBrowserStack />);

      expect(screen.queryByText('Skyward Gate')).not.toBeInTheDocument();
    });
  });

  describe('Ability level filtering - Intermediate users', () => {
    it('should render "Skyward Gate" path for intermediate users', () => {
      mockUserProfile = { abilityLevel: 'intermediate' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
      expect(screen.getByTestId('template-browser-skyward_gate_path')).toBeInTheDocument();
    });

    it('should NOT render "Learn the Basics" path for intermediate users', () => {
      mockUserProfile = { abilityLevel: 'intermediate' };

      render(<TemplateBrowserStack />);

      expect(screen.queryByText('Learn the Basics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('template-browser-beginner_path')).not.toBeInTheDocument();
    });

    it('should render static sections for intermediate users', () => {
      mockUserProfile = { abilityLevel: 'intermediate' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('New Lists')).toBeInTheDocument();
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });
  });

  describe('Ability level filtering - Advanced users', () => {
    it('should render "Skyward Gate" path for advanced users', () => {
      mockUserProfile = { abilityLevel: 'advanced' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
    });

    it('should NOT render "Learn the Basics" path for advanced users', () => {
      mockUserProfile = { abilityLevel: 'advanced' };

      render(<TemplateBrowserStack />);

      expect(screen.queryByText('Learn the Basics')).not.toBeInTheDocument();
    });
  });

  describe('Ability level filtering - Native users', () => {
    it('should NOT render any learning paths for native users', () => {
      mockUserProfile = { abilityLevel: 'native' };

      render(<TemplateBrowserStack />);

      expect(screen.queryByText('Learn the Basics')).not.toBeInTheDocument();
      expect(screen.queryByText('Skyward Gate')).not.toBeInTheDocument();
    });

    it('should still render static sections for native users', () => {
      mockUserProfile = { abilityLevel: 'native' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('New Lists')).toBeInTheDocument();
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });
  });

  describe('No user profile or missing ability level', () => {
    it('should render all paths when userProfile is null', () => {
      mockUserProfile = null;

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Learn the Basics')).toBeInTheDocument();
      expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
      expect(screen.getByText('New Lists')).toBeInTheDocument();
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });

    it('should render all paths when userProfile is undefined', () => {
      mockUserProfile = null;

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Learn the Basics')).toBeInTheDocument();
      expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
    });

    it('should render all paths when abilityLevel is missing from profile', () => {
      mockUserProfile = { preferredInputLang: 'en-GB', preferredTargetLang: 'it-IT' };

      render(<TemplateBrowserStack />);

      expect(screen.getByText('Learn the Basics')).toBeInTheDocument();
      expect(screen.getByText('Skyward Gate')).toBeInTheDocument();
    });
  });

  describe('Static sections rendering', () => {
    it('should always render "New Lists" section regardless of ability level', () => {
      const abilityLevels = ['beginner', 'elementary', 'intermediate', 'advanced', 'native'];

      abilityLevels.forEach((level) => {
        mockUserProfile = { abilityLevel: level };
        const { unmount } = render(<TemplateBrowserStack />);

        expect(screen.getByText('New Lists')).toBeInTheDocument();

        unmount();
      });
    });

    it('should always render "Recommended for You" section regardless of ability level', () => {
      const abilityLevels = ['beginner', 'elementary', 'intermediate', 'advanced', 'native'];

      abilityLevels.forEach((level) => {
        mockUserProfile = { abilityLevel: level };
        const { unmount } = render(<TemplateBrowserStack />);

        expect(screen.getByText('Recommended for You')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Props handling', () => {
    it('should pass showAllOverride prop to TemplatesBrowser components', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack showAllOverride={true} />);

      const templateBrowsers = screen.getAllByTestId(/template-browser/);

      templateBrowsers.forEach((browser) => {
        expect(browser.getAttribute('data-show-all-override')).toBe('true');
      });
    });

    it('should apply custom className to container', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      const { container } = render(<TemplateBrowserStack className="custom-class" />);

      const stackContainer = container.firstChild as HTMLElement;
      expect(stackContainer.className).toContain('custom-class');
    });

    it('should pass correct pathId to each learning path TemplatesBrowser', () => {
      mockUserProfile = { abilityLevel: undefined };

      render(<TemplateBrowserStack />);

      // Beginner path
      const beginnerBrowser = screen.getByTestId('template-browser-beginner_path');
      expect(beginnerBrowser.getAttribute('data-title')).toBe('Learn the Basics');

      // Skyward gate path
      const skywardBrowser = screen.getByTestId('template-browser-skyward_gate_path');
      expect(skywardBrowser.getAttribute('data-title')).toBe('Skyward Gate');
    });

    it('should not pass pathId to static sections', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack />);

      // New Lists and Recommended for You don't have pathId
      const noPathBrowsers = screen.getAllByTestId('template-browser-no-path');
      expect(noPathBrowsers.length).toBeGreaterThanOrEqual(2);
    });

    it('should set showHeader to false for all TemplatesBrowser instances', () => {
      mockUserProfile = { abilityLevel: undefined };

      render(<TemplateBrowserStack />);

      const templateBrowsers = screen.getAllByTestId(/template-browser/);

      templateBrowsers.forEach((browser) => {
        expect(browser.getAttribute('data-show-header')).toBe('false');
      });
    });
  });

  describe('Rendering order', () => {
    it('should render the default order when no recent data is stored', () => {
      mockUserProfile = { abilityLevel: 'beginner' };

      render(<TemplateBrowserStack />);

      const allSections = screen.getAllByTestId(/template-browser/);
      const browserIds = allSections.map(section => section.getAttribute('data-browser-id'));

      expect(browserIds[0]).toBe('new_lists');

      const newListsIndex = browserIds.indexOf('new_lists');
      const recommendedIndex = browserIds.indexOf('recommended_for_you');
      expect(newListsIndex).toBeLessThan(recommendedIndex);
    });

    it('should render multiple learning paths in correct order when available', () => {
      mockUserProfile = { abilityLevel: undefined };

      render(<TemplateBrowserStack />);

      const learningPaths = [
        screen.getByTestId('template-browser-beginner_path'),
        screen.getByTestId('template-browser-skyward_gate_path'),
      ];

      // Verify they appear in order
      const allBrowsers = screen.getAllByTestId(/template-browser/);
      const beginnerIndex = allBrowsers.indexOf(learningPaths[0]);
      const skywardIndex = allBrowsers.indexOf(learningPaths[1]);

      expect(beginnerIndex).toBeLessThan(skywardIndex);
    });

    it('should sort browsers by recent usage when stored', () => {
      mockUserProfile = { abilityLevel: undefined, preferredInputLang: 'en-GB', preferredTargetLang: 'it-IT' };
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

      const allSections = screen.getAllByTestId(/template-browser/);
      const browserIds = allSections.map(section => section.getAttribute('data-browser-id'));

      expect(browserIds[0]).toBe('recommended_for_you');
      expect(browserIds[1]).toBe('beginner_path');
      expect(browserIds[2]).toBe('new_lists');
    });
  });

  describe('Content personalization based on user preferences', () => {
    it('should render consistent content for users with same ability level', () => {
      // First render
      mockUserProfile = { abilityLevel: 'intermediate', preferredInputLang: 'en-GB' };
      const { unmount: unmount1 } = render(<TemplateBrowserStack />);

      const firstRender = screen.queryAllByTestId(/template-browser/).map(
        el => el.getAttribute('data-title')
      );

      unmount1();

      // Second render with different user but same ability level
      mockUserProfile = { abilityLevel: 'intermediate', preferredInputLang: 'es-ES' };
      render(<TemplateBrowserStack />);

      const secondRender = screen.queryAllByTestId(/template-browser/).map(
        el => el.getAttribute('data-title')
      );

      expect(firstRender).toEqual(secondRender);
    });
  });
});
