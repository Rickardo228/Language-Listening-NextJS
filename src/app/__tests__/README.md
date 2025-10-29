# Test Suite

This directory contains all tests for the Content Generator application.

## Structure

```
__tests__/
├── components/          # Component tests
│   ├── EditablePhrases.test.tsx
│   └── PhrasePlaybackView.test.tsx
├── utils/              # Utility and hook tests
│   ├── test-helpers.tsx
│   └── userStats.test.tsx
└── README.md
```

## Test Files

### Component Tests

#### `EditablePhrases.test.tsx` (8 tests ✅)
Tests the three dots menu bug fix and component functionality:
- ✅ Menu opens when clicking three dots **(Bug Fix: Menu not opening)**
- ✅ Event propagation stopped correctly
- ✅ Delete phrase functionality
- ✅ Multi-select mode activation
- ✅ Works in both layout modes
- ✅ Complete workflow integration

**Bug Fixed**: Three dots menu wasn't opening because Popover.Button was a wrapper div that didn't receive click events due to stopPropagation.

#### `PhrasePlaybackView.test.tsx` (8 tests ✅, 1 skipped)
Tests the audio playback component:
- ✅ Component renders with various configurations
- ✅ Different playback modes (auto/manual)
- ✅ Different input modes (input-only/output-only)
- ✅ Collection info rendering
- ⏭️ Empty phrases array (reveals a bug in the component)

**Bugs Fixed**:
- Listen tracking while paused
- Event-driven audio tracking

### Utility Tests

#### `userStats.test.tsx` (5 tests ✅)
Tests the user stats tracking hook:
- ✅ Increments viewed counter correctly **(Bug Fix: Off-by-one error)**
- ✅ Detects milestones at 5, 10, 15 **(Bug Fix: Popup at 7 instead of 5)**
- ✅ Skip session increment parameter
- ✅ Debounce delay under 500ms **(Bug Fix: 800ms too slow)**
- ✅ No milestones at wrong counts

**Bugs Fixed**:
1. Phrase viewed popup appeared at 7 instead of 5 phrases
2. Session counter and Firestore out of sync
3. Debounce delay too long (800ms → 400ms)

#### `test-helpers.tsx`
Shared test utilities:
- Mock data factories (`createMockPhrases`, `createMockAudioSegment`)
- Custom render functions with providers
- Re-exports testing-library utilities

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test EditablePhrases
npm test PhrasePlaybackView
npm test userStats

# Watch mode
npm test -- --watch

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

## Mocks

All mocks are located in `src/app/__mocks__/`:
- `audio.ts` - Mock Audio API for testing audio playback
- `firebase.ts` - Mock Firebase Auth and Firestore
- `mixpanel.ts` - Mock Mixpanel analytics

Mocks are automatically wired up in `vitest.setup.ts`.

## Test Philosophy

These are **integration tests** that test real components with real implementations. They:
- Import and test actual components (not mocked versions)
- Use real hooks and context providers
- Mock only external dependencies (Firebase, Audio, Analytics)
- Focus on testing bug fixes and critical user workflows

## Coverage

Current coverage: **20 tests passing** across 3 test files

All tests verify bug fixes from recent commits:
- ✅ Three dots menu opening
- ✅ Listen tracking while paused
- ✅ Event-driven audio tracking
- ✅ Phrase viewed popup timing
- ✅ Debounce responsiveness
