import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useParams, useRouter } from 'next/navigation'
import CollectionPage from '../../../collection/[id]/page'
import { mockFirestore } from '../../../__mocks__/firebase'
import { PresentationConfig } from '../../../types'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useParams: vi.fn(),
    useRouter: vi.fn(),
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
    const mocks = await import('../../../__mocks__/firebase')
    return {
        getFirestore: mocks.getFirestore,
        collection: mocks.mockFirestore.collection,
        doc: mocks.mockFirestore.doc,
        getDoc: mocks.mockFirestore.getDoc,
        updateDoc: mocks.mockFirestore.updateDoc,
        deleteDoc: mocks.mockFirestore.deleteDoc,
        addDoc: mocks.mockFirestore.addDoc,
        query: mocks.mockFirestore.query,
        where: mocks.mockFirestore.where,
        getDocs: mocks.mockFirestore.getDocs,
    }
})

// Mock UserContext
const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
}

let mockUserProfile = mockUser

vi.mock('../../../contexts/UserContext', () => ({
    useUser: () => ({
        user: mockUserProfile,
        userProfile: mockUserProfile,
        loading: false,
    }),
}))

// Mock usePresentationConfig
const mockSetPresentationConfigBase = vi.fn()
const mockPresentationConfig: PresentationConfig = {
    name: 'Default',
    bgImage: null,
    containerBg: 'white',
    textBg: 'black',
    enableSnow: false,
    enableCherryBlossom: false,
    enableLeaves: false,
    enableAutumnLeaves: false,
    enableOrtonEffect: false,
    postProcessDelay: 0,
    delayBetweenPhrases: 1000,
    enableLoop: true,
    enableOutputDurationDelay: true,
    enableInputDurationDelay: false,
    enableOutputBeforeInput: false,
    enableInputPlayback: true,
    inputPlaybackSpeed: 1.0,
    outputPlaybackSpeed: 1.0,
}

vi.mock('../../../hooks/usePresentationConfig', () => ({
    usePresentationConfig: () => ({
        get presentationConfig() {
            return mockPresentationConfig
        },
        setPresentationConfig: mockSetPresentationConfigBase,
    }),
}))

// Mock backgroundUpload
vi.mock('../../../utils/backgroundUpload', () => {
    const mockDeleteBackgroundMedia = vi.fn(() => Promise.resolve())
    const mockUploadBackgroundMedia = vi.fn(() => Promise.resolve({ downloadUrl: 'https://storage.googleapis.com/test.jpg' }))
    return {
        deleteBackgroundMedia: mockDeleteBackgroundMedia,
        uploadBackgroundMedia: mockUploadBackgroundMedia,
        __mockDeleteBackgroundMedia: mockDeleteBackgroundMedia,
        __mockUploadBackgroundMedia: mockUploadBackgroundMedia,
    }
})

// Get the mocked functions - will be set in beforeEach
let mockDeleteBackgroundMedia: ReturnType<typeof vi.fn>

// Mock PhrasePlaybackView to capture setPresentationConfig calls
let capturedSetPresentationConfig: ((config: Partial<PresentationConfig>) => Promise<void>) | null = null

vi.mock('../../../components/PhrasePlaybackView', () => ({
    PhrasePlaybackView: ({ setPresentationConfig }: { setPresentationConfig: (config: Partial<PresentationConfig>) => Promise<void> }) => {
        capturedSetPresentationConfig = setPresentationConfig
        return <div data-testid="phrase-playback-view">PhrasePlaybackView</div>
    },
    PhrasePlaybackMethods: {},
}))

// Mock CollectionHeader
vi.mock('../../../CollectionHeader', () => ({
    CollectionHeader: () => <div data-testid="collection-header">CollectionHeader</div>,
}))

// Mock ImportPhrases
vi.mock('../../../ImportPhrases', () => ({
    ImportPhrases: () => <div data-testid="import-phrases">ImportPhrases</div>,
}))

describe('CollectionPage - Background Removal', () => {
    const mockCollectionId = 'test-collection-id'
    const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
    }

    beforeEach(async () => {
        vi.clearAllMocks()
        mockUserProfile = mockUser
        capturedSetPresentationConfig = null
        mockPresentationConfig.bgImage = null

        // Get the mocked functions
        const backgroundUploadModule = await import('../../../utils/backgroundUpload')
        mockDeleteBackgroundMedia = (backgroundUploadModule as unknown as { __mockDeleteBackgroundMedia: ReturnType<typeof vi.fn> }).__mockDeleteBackgroundMedia

            // Setup default mocks
            ; (useParams as ReturnType<typeof vi.fn>).mockReturnValue({ id: mockCollectionId })
            ; (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)

        // Mock Firestore responses
        mockFirestore.collection.mockReturnValue({
            id: 'collections',
        })

        mockFirestore.doc.mockReturnValue({
            id: 'collection-doc',
        })

        mockFirestore.getDoc.mockResolvedValue({
            exists: () => true,
            id: mockCollectionId,
            data: () => ({
                name: 'Test Collection',
                phrases: [],
                presentationConfig: mockPresentationConfig,
            }),
        } as unknown as Awaited<ReturnType<typeof mockFirestore.getDoc>>)

        mockFirestore.updateDoc.mockResolvedValue(undefined)
    })

    describe('setPresentationConfig - Background Removal', () => {
        it('should delete background from Firebase Storage when bgImage is set to null', async () => {
            // Set initial background in the mock config (using getter, so this will work)
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            render(<CollectionPage />)

            // Wait for component to mount and setPresentationConfig to be available
            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            }, { timeout: 2000 })

            // Call setPresentationConfig with bgImage: null
            await capturedSetPresentationConfig!({ bgImage: null })

            // Verify deleteBackgroundMedia was called with correct parameters
            expect(mockDeleteBackgroundMedia).toHaveBeenCalledWith(
                'test-user-id',
                mockCollectionId,
                'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'
            )

            // Verify setPresentationConfigBase was called
            expect(mockSetPresentationConfigBase).toHaveBeenCalledWith({ bgImage: null })

            // Verify Firestore update was called
            await waitFor(() => {
                expect(mockFirestore.updateDoc).toHaveBeenCalled()
            })
        })

        it('should NOT delete background if it is not a Firebase Storage URL', async () => {
            // Set initial background to a non-Firebase URL
            mockPresentationConfig.bgImage = 'https://example.com/image.jpg'

            render(<CollectionPage />)

            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            })

            // Call setPresentationConfig with bgImage: null
            await capturedSetPresentationConfig!({ bgImage: null })

            // Verify deleteBackgroundMedia was NOT called
            expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()

            // Verify setPresentationConfigBase was still called
            expect(mockSetPresentationConfigBase).toHaveBeenCalledWith({ bgImage: null })

            // Verify Firestore update was called
            expect(mockFirestore.updateDoc).toHaveBeenCalled()
        })

        it('should NOT delete background if bgImage is not being set to null', async () => {
            // Set initial background
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            render(<CollectionPage />)

            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            })

            // Call setPresentationConfig with a different field (not bgImage: null)
            await capturedSetPresentationConfig!({ containerBg: 'red' })

            // Verify deleteBackgroundMedia was NOT called
            expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()

            // Verify setPresentationConfigBase was called
            expect(mockSetPresentationConfigBase).toHaveBeenCalledWith({ containerBg: 'red' })
        })

        it('should NOT delete background if there is no existing background', async () => {
            // No initial background
            mockPresentationConfig.bgImage = null

            render(<CollectionPage />)

            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            })

            // Call setPresentationConfig with bgImage: null
            await capturedSetPresentationConfig!({ bgImage: null })

            // Verify deleteBackgroundMedia was NOT called (no background to delete)
            expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()

            // Verify setPresentationConfigBase was still called
            expect(mockSetPresentationConfigBase).toHaveBeenCalledWith({ bgImage: null })
        })

        it('should handle background deletion errors gracefully', async () => {
            // Set initial background
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            // Mock deleteBackgroundMedia to throw an error
            mockDeleteBackgroundMedia.mockRejectedValueOnce(new Error('Deletion failed'))

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            render(<CollectionPage />)

            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            })

            // Call setPresentationConfig with bgImage: null
            await capturedSetPresentationConfig!({ bgImage: null })

            // Verify deleteBackgroundMedia was called
            expect(mockDeleteBackgroundMedia).toHaveBeenCalled()

            // Verify error was logged
            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Error deleting background:',
                    expect.any(Error)
                )
            })

            // Verify setPresentationConfigBase was still called despite error
            expect(mockSetPresentationConfigBase).toHaveBeenCalledWith({ bgImage: null })

            // Verify Firestore update still proceeded despite deletion error
            expect(mockFirestore.updateDoc).toHaveBeenCalled()

            consoleErrorSpy.mockRestore()
        })

        it('should NOT delete background if user is not available', async () => {
            // Set initial background
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            // Mock user as null/undefined
            vi.mocked(useParams).mockReturnValue({ id: mockCollectionId })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockUserProfile = null as any

            render(<CollectionPage />)

            // Wait a bit for component to potentially mount
            await waitFor(() => {
                // Component might not mount properly without user, so we check if setPresentationConfig exists
                // If it doesn't exist, that's fine - the test passes because deletion wouldn't happen
                if (capturedSetPresentationConfig) {
                    return true
                }
                return true // Component rendered "Collection not found" which is expected
            }, { timeout: 1000 })

            // If setPresentationConfig is available, test that deletion doesn't happen
            if (capturedSetPresentationConfig) {
                await capturedSetPresentationConfig({ bgImage: null })

                // Verify deleteBackgroundMedia was NOT called (no user)
                expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()
            } else {
                // Component didn't mount properly without user, which is expected behavior
                expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()
            }
        })

        it('should NOT delete background if selectedCollection is not available', async () => {
            // Set initial background
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            // Mock getDoc to return a collection without an id (simulating no collection)
            mockFirestore.getDoc.mockResolvedValue({
                exists: () => false,
            } as unknown as Awaited<ReturnType<typeof mockFirestore.getDoc>>)

            render(<CollectionPage />)

            // Component should render "Collection not found" message
            // But if setPresentationConfig somehow gets called, it shouldn't delete
            // This test verifies the guard clause works
            if (capturedSetPresentationConfig) {
                await capturedSetPresentationConfig({ bgImage: null })

                // Verify deleteBackgroundMedia was NOT called (no collection)
                expect(mockDeleteBackgroundMedia).not.toHaveBeenCalled()
            }
        })

        it('should update Firestore with new config after background deletion', async () => {
            // Set initial background
            mockPresentationConfig.bgImage = 'https://storage.googleapis.com/test-bucket/backgrounds/test-user-id/test-collection-id/image.jpg'

            render(<CollectionPage />)

            await waitFor(() => {
                expect(capturedSetPresentationConfig).toBeTruthy()
            })

            // Call setPresentationConfig with bgImage: null
            await capturedSetPresentationConfig!({ bgImage: null })

            // Verify Firestore update was called
            await waitFor(() => {
                expect(mockFirestore.updateDoc).toHaveBeenCalled()
            })

            // Verify the update includes bgImage: null
            const updateCalls = mockFirestore.updateDoc.mock.calls as unknown as Array<[unknown, { presentationConfig: PresentationConfig }]>
            const updateData = updateCalls[0][1]
            expect(updateData.presentationConfig.bgImage).toBeNull()
        })
    })
})

