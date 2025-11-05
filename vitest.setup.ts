import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { MockAudio } from "./src/app/__mocks__/audio";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup global Audio mock
beforeAll(() => {
  global.Audio = MockAudio as unknown as typeof Audio;
});

// Mock Firebase modules
vi.mock("firebase/firestore", async () => {
  const mocks = await import("./src/app/__mocks__/firebase");
  return {
    getFirestore: mocks.getFirestore,
    collection: mocks.mockFirestore.collection,
    doc: mocks.mockFirestore.doc,
    getDoc: mocks.mockFirestore.getDoc,
    getDocs: mocks.mockFirestore.getDocs,
    setDoc: mocks.mockFirestore.setDoc,
    updateDoc: mocks.mockFirestore.updateDoc,
    deleteDoc: mocks.mockFirestore.deleteDoc,
    addDoc: mocks.mockFirestore.addDoc,
    query: mocks.mockFirestore.query,
    where: mocks.mockFirestore.where,
    orderBy: mocks.mockFirestore.orderBy,
    limit: mocks.mockFirestore.limit,
    runTransaction: mocks.mockFirestore.runTransaction,
    increment: mocks.increment,
  };
});

vi.mock("firebase/auth", async () => {
  const mocks = await import("./src/app/__mocks__/firebase");
  return {
    getAuth: mocks.getAuth,
    onAuthStateChanged: mocks.mockAuth.onAuthStateChanged,
    signInWithEmailAndPassword: mocks.mockAuth.signInWithEmailAndPassword,
    signInWithPopup: mocks.mockAuth.signInWithPopup,
    signOut: mocks.mockAuth.signOut,
    createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
    GoogleAuthProvider: class GoogleAuthProvider {},
  };
});

// Mock Mixpanel
vi.mock("@/lib/mixpanelClient", async () => {
  const mocks = await import("./src/app/__mocks__/mixpanel");
  return {
    track: mocks.track,
    trackAudioEnded: mocks.trackAudioEnded,
    trackPlaybackEvent: mocks.trackPlaybackEvent,
    trackPageView: mocks.trackPageView,
    trackSignUp: mocks.trackSignUp,
    trackLogin: mocks.trackLogin,
    trackCreateList: mocks.trackCreateList,
    trackSelectList: mocks.trackSelectList,
    trackCreatePhrase: mocks.trackCreatePhrase,
    trackGeneratePhrases: mocks.trackGeneratePhrases,
    trackOnboardingCompleted: mocks.trackOnboardingCompleted,
    trackPhrasesListenedPopup: mocks.trackPhrasesListenedPopup,
    identifyUser: mocks.identifyUser,
    setUserProperties: mocks.setUserProperties,
    initMixpanel: mocks.initMixpanel,
    setEnvironmentInfo: mocks.setEnvironmentInfo,
    resetAllMixpanelMocks: mocks.resetAllMixpanelMocks,
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;
