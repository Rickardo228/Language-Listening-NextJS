import { vi } from 'vitest'

// Mock all the Mixpanel tracking functions
export const track = vi.fn()
export const trackAudioEnded = vi.fn()
export const trackPlaybackEvent = vi.fn()
export const trackPageView = vi.fn()
export const trackSignUp = vi.fn()
export const trackLogin = vi.fn()
export const trackCreateList = vi.fn()
export const trackSelectList = vi.fn()
export const trackCreatePhrase = vi.fn()
export const trackGeneratePhrases = vi.fn()
export const trackOnboardingCompleted = vi.fn()
export const trackPhrasesListenedPopup = vi.fn()
export const identifyUser = vi.fn()
export const setUserProperties = vi.fn()
export const initMixpanel = vi.fn()
export const setEnvironmentInfo = vi.fn()

// Helper to reset all mocks
export const resetAllMixpanelMocks = () => {
  track.mockClear()
  trackAudioEnded.mockClear()
  trackPlaybackEvent.mockClear()
  trackPageView.mockClear()
  trackSignUp.mockClear()
  trackLogin.mockClear()
  trackCreateList.mockClear()
  trackSelectList.mockClear()
  trackCreatePhrase.mockClear()
  trackGeneratePhrases.mockClear()
  trackOnboardingCompleted.mockClear()
  trackPhrasesListenedPopup.mockClear()
  identifyUser.mockClear()
  setUserProperties.mockClear()
  initMixpanel.mockClear()
  setEnvironmentInfo.mockClear()
}
