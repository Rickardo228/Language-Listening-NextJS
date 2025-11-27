import { describe, it, expect } from "vitest";
import { getRecommendedPaths } from "../../utils/contentRecommendations";

describe("contentRecommendations", () => {
  describe("getRecommendedPaths", () => {
    describe("Beginner users", () => {
      it('should return only "Learn the Basics" path for beginner users', () => {
        const paths = getRecommendedPaths("beginner");

        expect(paths).toHaveLength(1);
        expect(paths[0].id).toBe("beginner_path");
        expect(paths[0].title).toBe("Learn the Basics");
        expect(paths[0].pathId).toBe("beginner_path");
      });

      it('should NOT return "Skyward Gate" path for beginner users', () => {
        const paths = getRecommendedPaths("beginner");

        const hasSkywardGate = paths.some((path) => path.id === "skyward_gate");
        expect(hasSkywardGate).toBe(false);
      });
    });

    describe("Elementary users", () => {
      it('should return only "Learn the Basics" path for elementary users', () => {
        const paths = getRecommendedPaths("elementary");

        expect(paths).toHaveLength(1);
        expect(paths[0].id).toBe("beginner_path");
        expect(paths[0].title).toBe("Learn the Basics");
      });

      it('should NOT return "Skyward Gate" path for elementary users', () => {
        const paths = getRecommendedPaths("elementary");

        const hasSkywardGate = paths.some((path) => path.id === "skyward_gate");
        expect(hasSkywardGate).toBe(false);
      });
    });

    describe("Intermediate users", () => {
      it('should return only "Skyward Gate" path for intermediate users', () => {
        const paths = getRecommendedPaths("intermediate");

        expect(paths).toHaveLength(1);
        expect(paths[0].id).toBe("skyward_gate");
        expect(paths[0].title).toBe("Skyward Gate");
        expect(paths[0].pathId).toBe("skyward_gate_path");
      });

      it('should NOT return "Learn the Basics" path for intermediate users', () => {
        const paths = getRecommendedPaths("intermediate");

        const hasBeginnerPath = paths.some(
          (path) => path.id === "beginner_path"
        );
        expect(hasBeginnerPath).toBe(false);
      });
    });

    describe("Advanced users", () => {
      it('should return only "Skyward Gate" path for advanced users', () => {
        const paths = getRecommendedPaths("advanced");

        expect(paths).toHaveLength(1);
        expect(paths[0].id).toBe("skyward_gate");
        expect(paths[0].title).toBe("Skyward Gate");
      });

      it('should NOT return "Learn the Basics" path for advanced users', () => {
        const paths = getRecommendedPaths("advanced");

        const hasBeginnerPath = paths.some(
          (path) => path.id === "beginner_path"
        );
        expect(hasBeginnerPath).toBe(false);
      });
    });

    describe("Native users", () => {
      it("should return empty array for native users (no learning paths)", () => {
        const paths = getRecommendedPaths("native");

        expect(paths).toHaveLength(0);
        expect(paths).toEqual([]);
      });

      it("should NOT return any learning paths for native users", () => {
        const paths = getRecommendedPaths("native");

        const hasBeginnerPath = paths.some(
          (path) => path.id === "beginner_path"
        );
        const hasSkywardGate = paths.some((path) => path.id === "skyward_gate");

        expect(hasBeginnerPath).toBe(false);
        expect(hasSkywardGate).toBe(false);
      });
    });

    describe("Undefined ability level", () => {
      it("should return all available paths when ability level is undefined", () => {
        const paths = getRecommendedPaths(undefined);

        expect(paths).toHaveLength(2);

        const pathIds = paths.map((path) => path.id);
        expect(pathIds).toContain("beginner_path");
        expect(pathIds).toContain("skyward_gate");
      });

      it("should return paths in correct order when ability level is undefined", () => {
        const paths = getRecommendedPaths(undefined);

        expect(paths[0].id).toBe("beginner_path");
        expect(paths[1].id).toBe("skyward_gate");
      });
    });

    describe("Edge cases and filtering logic", () => {
      it("should correctly filter paths with maxAbilityLevel constraint", () => {
        // Beginner path has maxAbilityLevel: 'elementary'
        const beginnerPaths = getRecommendedPaths("beginner");
        const elementaryPaths = getRecommendedPaths("elementary");
        const intermediatePaths = getRecommendedPaths("intermediate");

        // Should include beginner path for beginner and elementary
        expect(beginnerPaths.some((p) => p.id === "beginner_path")).toBe(true);
        expect(elementaryPaths.some((p) => p.id === "beginner_path")).toBe(
          true
        );

        // Should exclude beginner path for intermediate and above
        expect(intermediatePaths.some((p) => p.id === "beginner_path")).toBe(
          false
        );
      });

      it("should correctly filter paths with minAbilityLevel constraint", () => {
        // Skyward gate has minAbilityLevel: 'intermediate'
        const beginnerPaths = getRecommendedPaths("beginner");
        const elementaryPaths = getRecommendedPaths("elementary");
        const intermediatePaths = getRecommendedPaths("intermediate");

        // Should exclude skyward gate for beginner and elementary
        expect(beginnerPaths.some((p) => p.id === "skyward_gate")).toBe(false);
        expect(elementaryPaths.some((p) => p.id === "skyward_gate")).toBe(
          false
        );

        // Should include skyward gate for intermediate and above
        expect(intermediatePaths.some((p) => p.id === "skyward_gate")).toBe(
          true
        );
      });

      it("should correctly filter paths with both min and max constraints", () => {
        // Skyward gate has minAbilityLevel: 'intermediate', maxAbilityLevel: 'advanced'
        const intermediatePaths = getRecommendedPaths("intermediate");
        const advancedPaths = getRecommendedPaths("advanced");
        const nativePaths = getRecommendedPaths("native");

        // Should include for intermediate and advanced
        expect(intermediatePaths.some((p) => p.id === "skyward_gate")).toBe(
          true
        );
        expect(advancedPaths.some((p) => p.id === "skyward_gate")).toBe(true);

        // Should exclude for native (above max)
        expect(nativePaths.some((p) => p.id === "skyward_gate")).toBe(false);
      });
    });

    describe("Return value structure", () => {
      it("should return ContentSection objects with correct properties", () => {
        const paths = getRecommendedPaths("beginner");

        expect(paths[0]).toHaveProperty("id");
        expect(paths[0]).toHaveProperty("type");
        expect(paths[0]).toHaveProperty("title");
        expect(paths[0]).toHaveProperty("pathId");
        expect(paths[0].type).toBe("path");
      });

      it("should return ContentSection objects with ability level constraints", () => {
        const allPaths = getRecommendedPaths(undefined);

        // Beginner path should have maxAbilityLevel
        const beginnerPath = allPaths.find((p) => p.id === "beginner_path");
        expect(beginnerPath).toBeDefined();
        expect(beginnerPath?.maxAbilityLevel).toBe("elementary");

        // Skyward gate should have both min and max
        const skywardGate = allPaths.find((p) => p.id === "skyward_gate");
        expect(skywardGate).toBeDefined();
        expect(skywardGate?.minAbilityLevel).toBe("intermediate");
        expect(skywardGate?.maxAbilityLevel).toBe("advanced");
      });
    });
  });
});
