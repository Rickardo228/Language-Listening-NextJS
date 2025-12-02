export type AbilityLevel =
  | "beginner"
  | "elementary"
  | "intermediate"
  | "advanced"
  | "native";

export interface ContentSection {
  id: string;
  type: "path" | "recent" | "recommended";
  title: string;
  pathId?: string;
  tags?: string[];
  minAbilityLevel?: AbilityLevel;
  maxAbilityLevel?: AbilityLevel;
  showAllOverride?: boolean;
}

const ABILITY_HIERARCHY: Record<AbilityLevel, number> = {
  beginner: 0,
  elementary: 1,
  intermediate: 2,
  advanced: 3,
  native: 4,
} as const;

// Learning paths that are filtered by ability level
const LEARNING_PATHS: ContentSection[] = [
  {
    id: "beginner_path",
    type: "path",
    pathId: "beginner_path",
    title: "Learn the Basics",
    maxAbilityLevel: "elementary", // Only beginner and elementary
  },
  {
    id: "skyward_gate",
    type: "path",
    pathId: "skyward_gate_path",
    title: "Skyward Gate",
    minAbilityLevel: "intermediate",
    maxAbilityLevel: "advanced", // Only intermediate and advanced
  },
  {
    id: "platform_in_the_snow",
    type: "path",
    pathId: "platform_in_the_snow_path",
    title: "Platform in the Snow",
    minAbilityLevel: "intermediate",
    maxAbilityLevel: "advanced", // Only intermediate and advanced
  },
];

/**
 * Get learning paths filtered by user's ability level
 * @param userAbilityLevel - The user's current ability level
 * @returns Filtered array of learning paths appropriate for the user's level
 */
export function getRecommendedPaths(
  userAbilityLevel?: AbilityLevel
): ContentSection[] {
  // If no ability level is provided, return all paths
  if (!userAbilityLevel) {
    return LEARNING_PATHS;
  }

  const userLevel = ABILITY_HIERARCHY[userAbilityLevel];

  return LEARNING_PATHS.filter((section) => {
    // Check minimum ability level requirement
    if (section.minAbilityLevel) {
      const minLevel = ABILITY_HIERARCHY[section.minAbilityLevel];
      if (userLevel < minLevel) {
        return false;
      }
    }

    // Check maximum ability level requirement
    if (section.maxAbilityLevel) {
      const maxLevel = ABILITY_HIERARCHY[section.maxAbilityLevel];
      if (userLevel > maxLevel) {
        return false;
      }
    }

    return true;
  });
}
