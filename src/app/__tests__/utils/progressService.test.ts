import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  markCompleted,
  getRecentTemplates,
  clearProgress,
} from "../../utils/progressService";
import { ProgressData } from "../../types";
import * as firebaseModule from "../../firebase";

// Mock Firebase
vi.mock("../../firebase", () => ({
  firestore: {
    collection: vi.fn(),
  },
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date("2025-01-15T12:00:00Z") })),
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
  arrayUnion: vi.fn((value) => ({ _type: "arrayUnion", value })),
}));

// Import after mocking so we get the mocked versions
const {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  arrayUnion,
} = await import("firebase/firestore");

describe("progressService", () => {
  const mockUserId = "test-user-123";
  const mockCollectionId = "collection-456";
  const mockInputLang = "en";
  const mockTargetLang = "es";
  const mockItemId = `${mockCollectionId}_${mockInputLang}_${mockTargetLang}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadProgress", () => {
    it("should load progress successfully when document exists", async () => {
      const mockProgressData = {
        itemType: "collection",
        lastPhraseIndex: 5,
        lastPhase: "output",
        lastAccessedAt: {
          toDate: () => new Date("2025-01-15T10:00:00Z"),
        },
        completedAt: null,
        listenedPhraseIndices: [0, 1, 2, 3, 4, 5],
      };

      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => mockProgressData,
      });

      const result = await loadProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(result).toEqual({
        collectionId: mockCollectionId,
        itemType: "collection",
        lastPhraseIndex: 5,
        lastPhase: "output",
        lastAccessedAt: "2025-01-15T10:00:00.000Z",
        completedAt: undefined,
        inputLang: mockInputLang,
        targetLang: mockTargetLang,
        listenedPhraseIndices: [0, 1, 2, 3, 4, 5],
      });

      expect(doc).toHaveBeenCalledWith(
        firebaseModule.firestore,
        "users",
        mockUserId,
        "progress",
        mockItemId
      );
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it("should return null when document does not exist", async () => {
      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => false,
      });

      const result = await loadProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(result).toBeNull();
    });

    it("should handle missing completedAt field", async () => {
      const mockProgressData = {
        itemType: "template",
        lastPhraseIndex: 3,
        lastPhase: "input",
        lastAccessedAt: {
          toDate: () => new Date("2025-01-15T10:00:00Z"),
        },
        listenedPhraseIndices: [0, 1, 2],
      };

      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => mockProgressData,
      });

      const result = await loadProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(result?.completedAt).toBeUndefined();
    });

    it("should handle errors gracefully and return null", async () => {
      (doc as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Firestore error");
      });

      const result = await loadProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(result).toBeNull();
    });

    it("should default to empty array if listenedPhraseIndices is missing", async () => {
      const mockProgressData = {
        itemType: "collection",
        lastPhraseIndex: 2,
        lastPhase: "output",
        lastAccessedAt: {
          toDate: () => new Date("2025-01-15T10:00:00Z"),
        },
      };

      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (getDoc as ReturnType<typeof vi.fn>).mockResolvedValue({
        exists: () => true,
        data: () => mockProgressData,
      });

      const result = await loadProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(result?.listenedPhraseIndices).toEqual([]);
    });
  });

  describe("saveProgress", () => {
    it("should save progress with all fields", async () => {
      const progressData: ProgressData = {
        collectionId: mockCollectionId,
        itemType: "collection",
        lastPhraseIndex: 7,
        lastPhase: "input",
        lastAccessedAt: "2025-01-15T11:00:00Z",
        inputLang: mockInputLang,
        targetLang: mockTargetLang,
      };

      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await saveProgress(mockUserId, progressData);

      expect(doc).toHaveBeenCalledWith(
        firebaseModule.firestore,
        "users",
        mockUserId,
        "progress",
        mockItemId
      );

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          itemId: mockItemId,
          itemType: "collection",
          lastPhraseIndex: 7,
          lastPhase: "input",
          lastAccessedAt: expect.anything(),
          inputLang: mockInputLang,
          targetLang: mockTargetLang,
          listenedPhraseIndices: expect.anything(),
        }),
        { merge: true }
      );

      expect(arrayUnion).toHaveBeenCalledWith(7);
    });

    it("should save progress for template type", async () => {
      const progressData: ProgressData = {
        collectionId: "template-789",
        itemType: "template",
        lastPhraseIndex: 3,
        lastPhase: "output",
        lastAccessedAt: "2025-01-15T11:00:00Z",
        inputLang: "fr",
        targetLang: "de",
      };

      const mockDocRef = { id: "template-789_fr_de" };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await saveProgress(mockUserId, progressData);

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          itemType: "template",
          lastPhraseIndex: 3,
          lastPhase: "output",
        }),
        { merge: true }
      );
    });

    it("should handle completedAt timestamp when provided", async () => {
      const progressData: ProgressData = {
        collectionId: mockCollectionId,
        itemType: "collection",
        lastPhraseIndex: 10,
        lastPhase: "output",
        lastAccessedAt: "2025-01-15T11:00:00Z",
        completedAt: "2025-01-15T12:00:00Z",
        inputLang: mockInputLang,
        targetLang: mockTargetLang,
      };

      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await saveProgress(mockUserId, progressData);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(
        new Date("2025-01-15T12:00:00Z")
      );
    });

    it("should handle errors gracefully", async () => {
      const progressData: ProgressData = {
        collectionId: mockCollectionId,
        itemType: "collection",
        lastPhraseIndex: 5,
        lastPhase: "input",
        lastAccessedAt: "2025-01-15T11:00:00Z",
        inputLang: mockInputLang,
        targetLang: mockTargetLang,
      };

      (doc as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Firestore error");
      });

      // Should not throw
      await expect(
        saveProgress(mockUserId, progressData)
      ).resolves.toBeUndefined();
    });
  });

  describe("markCompleted", () => {
    it("should mark progress as completed with timestamp", async () => {
      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (setDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await markCompleted(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(doc).toHaveBeenCalledWith(
        firebaseModule.firestore,
        "users",
        mockUserId,
        "progress",
        mockItemId
      );

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        {
          completedAt: expect.anything(),
        },
        { merge: true }
      );

      expect(Timestamp.now).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (doc as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Firestore error");
      });

      // Should not throw
      await expect(
        markCompleted(
          mockUserId,
          mockCollectionId,
          mockInputLang,
          mockTargetLang
        )
      ).resolves.toBeUndefined();
    });
  });

  describe("getRecentTemplates", () => {
    it("should retrieve recent templates ordered by lastAccessedAt", async () => {
      const mockDocs = [
        {
          id: "item1",
          data: () => ({
            collectionId: "collection-1",
            itemType: "collection",
            lastPhraseIndex: 5,
            lastPhase: "output",
            lastAccessedAt: {
              toDate: () => new Date("2025-01-15T10:00:00Z"),
            },
            inputLang: "en",
            targetLang: "es",
            listenedPhraseIndices: [0, 1, 2, 3, 4, 5],
          }),
        },
        {
          id: "item2",
          data: () => ({
            collectionId: "template-1",
            itemType: "template",
            lastPhraseIndex: 3,
            lastPhase: "input",
            lastAccessedAt: {
              toDate: () => new Date("2025-01-14T10:00:00Z"),
            },
            completedAt: {
              toDate: () => new Date("2025-01-14T11:00:00Z"),
            },
            inputLang: "fr",
            targetLang: "de",
            listenedPhraseIndices: [0, 1, 2, 3],
          }),
        },
      ];

      const mockCollectionRef = { path: "users/test/progress" };
      const mockQueryObj = { type: "query" };

      (collection as ReturnType<typeof vi.fn>).mockReturnValue(
        mockCollectionRef
      );
      (query as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryObj);
      (orderBy as ReturnType<typeof vi.fn>).mockReturnValue({});
      (limit as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
        docs: mockDocs,
      });

      const result = await getRecentTemplates(mockUserId, 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        collectionId: "collection-1",
        itemType: "collection",
        lastPhraseIndex: 5,
        lastPhase: "output",
        lastAccessedAt: "2025-01-15T10:00:00.000Z",
        completedAt: undefined,
        inputLang: "en",
        targetLang: "es",
        listenedPhraseIndices: [0, 1, 2, 3, 4, 5],
      });
      expect(result[1]).toEqual({
        collectionId: "template-1",
        itemType: "template",
        lastPhraseIndex: 3,
        lastPhase: "input",
        lastAccessedAt: "2025-01-14T10:00:00.000Z",
        completedAt: "2025-01-14T11:00:00.000Z",
        inputLang: "fr",
        targetLang: "de",
        listenedPhraseIndices: [0, 1, 2, 3],
      });

      expect(orderBy).toHaveBeenCalledWith("lastAccessedAt", "desc");
      expect(limit).toHaveBeenCalledWith(10);
    });

    it("should use default limit of 10 when not specified", async () => {
      (collection as ReturnType<typeof vi.fn>).mockReturnValue({});
      (query as ReturnType<typeof vi.fn>).mockReturnValue({});
      (orderBy as ReturnType<typeof vi.fn>).mockReturnValue({});
      (limit as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
        docs: [],
      });

      await getRecentTemplates(mockUserId);

      expect(limit).toHaveBeenCalledWith(10);
    });

    it("should return empty array on error", async () => {
      (collection as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Firestore error");
      });

      const result = await getRecentTemplates(mockUserId);

      expect(result).toEqual([]);
    });

    it("should handle missing listenedPhraseIndices field", async () => {
      const mockDocs = [
        {
          id: "item1",
          data: () => ({
            collectionId: "collection-1",
            itemType: "collection",
            lastPhraseIndex: 2,
            lastPhase: "output",
            lastAccessedAt: {
              toDate: () => new Date("2025-01-15T10:00:00Z"),
            },
            inputLang: "en",
            targetLang: "es",
          }),
        },
      ];

      (collection as ReturnType<typeof vi.fn>).mockReturnValue({});
      (query as ReturnType<typeof vi.fn>).mockReturnValue({});
      (orderBy as ReturnType<typeof vi.fn>).mockReturnValue({});
      (limit as ReturnType<typeof vi.fn>).mockReturnValue({});
      (getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({
        docs: mockDocs,
      });

      const result = await getRecentTemplates(mockUserId);

      expect(result[0].listenedPhraseIndices).toEqual([]);
    });
  });

  describe("clearProgress", () => {
    it("should delete progress document", async () => {
      const mockDocRef = { id: mockItemId };
      (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
      (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await clearProgress(
        mockUserId,
        mockCollectionId,
        mockInputLang,
        mockTargetLang
      );

      expect(doc).toHaveBeenCalledWith(
        firebaseModule.firestore,
        "users",
        mockUserId,
        "progress",
        mockItemId
      );
      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it("should handle errors gracefully", async () => {
      (doc as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Firestore error");
      });

      // Should not throw
      await expect(
        clearProgress(
          mockUserId,
          mockCollectionId,
          mockInputLang,
          mockTargetLang
        )
      ).resolves.toBeUndefined();
    });
  });
});
