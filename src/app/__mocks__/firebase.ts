import { vi } from 'vitest'

interface MockUserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  isAnonymous: boolean
  metadata: Record<string, unknown>
  providerData: unknown[]
  refreshToken: string
  tenantId: string | null
  delete: () => Promise<void>
  getIdToken: () => Promise<string>
  getIdTokenResult: () => Promise<unknown>
  reload: () => Promise<void>
  toJSON: () => unknown
}

// Mock Firebase User
export const createMockUser = (overrides?: Partial<MockUserData>) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(() => Promise.resolve('mock-token')),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  ...overrides,
})

// Mock Auth
export const mockAuth = {
  currentUser: createMockUser(),
  onAuthStateChanged: vi.fn(() => {
    // Return an unsubscribe function
    return vi.fn()
  }),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({}),
  })),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [],
    empty: true,
  })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  runTransaction: vi.fn(async (_, callback) => {
    // Mock transaction with get and update methods
    const transaction = {
      get: vi.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({
          currentStreak: 0,
          phrasesListened: 0,
          phrasesViewed: 0,
        }),
      })),
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }
    return callback(transaction)
  }),
  increment: vi.fn((value: number) => ({ _type: 'increment', value })),
}

// Mock increment function (needed for Firestore field updates)
export const increment = mockFirestore.increment

// Mock getFirestore function
export const getFirestore = vi.fn(() => mockFirestore)

// Mock getAuth function
export const getAuth = vi.fn(() => mockAuth)

// Mock auth export (used by firebase.ts)
export const auth = mockAuth
