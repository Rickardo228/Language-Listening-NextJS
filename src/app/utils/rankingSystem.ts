// Shared ranking system for phrase milestones and stats display

export interface RankInfo {
  title: string;
  color: string;
  nextMilestone: number;
  description: string;
}

// Production milestone thresholds and their corresponding rank info
const PRODUCTION_PHRASE_RANKS: Array<{ threshold: number } & RankInfo> = [
  { threshold: 100000, title: "App Legend", color: "text-amber-500", nextMilestone: 0, description: "You've achieved legendary status in using this app!" },
  { threshold: 75000, title: "Ultra Dedicated", color: "text-purple-600", nextMilestone: 100000, description: "Your commitment to practice is extraordinary" },
  { threshold: 50000, title: "Practice Master", color: "text-purple-600", nextMilestone: 75000, description: "You've mastered the art of consistent practice" },
  { threshold: 35000, title: "Highly Committed", color: "text-blue-600", nextMilestone: 50000, description: "Your dedication to practice is impressive" },
  { threshold: 25000, title: "Very Dedicated", color: "text-blue-600", nextMilestone: 35000, description: "You're showing exceptional commitment to practice" },
  { threshold: 15000, title: "Dedicated Practitioner", color: "text-green-600", nextMilestone: 25000, description: "You're building excellent practice habits" },
  { threshold: 10000, title: "Consistent Practitioner", color: "text-green-600", nextMilestone: 15000, description: "You're developing strong practice routines" },
  { threshold: 5000, title: "Regular User", color: "text-yellow-600", nextMilestone: 10000, description: "You're building consistent practice habits" },
  { threshold: 2500, title: "Active Learner", color: "text-yellow-500", nextMilestone: 5000, description: "You're actively engaging with the app" },
  { threshold: 1000, title: "Getting Into It", color: "text-orange-600", nextMilestone: 2500, description: "You're developing a practice routine" },
  { threshold: 500, title: "New User", color: "text-orange-500", nextMilestone: 1000, description: "Welcome to the app!" },
  { threshold: 0, title: "Getting Started", color: "text-gray-500", nextMilestone: 500, description: "Every practice session counts" }
];

// Debug mode settings
export const DEBUG_MILESTONE_THRESHOLDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const DEBUG_PHRASE_RANKS: Array<RankInfo> = [
  { title: "Getting Started", color: "text-gray-500", description: "Every practice session counts", nextMilestone: 2 },
  { title: "First Step", color: "text-gray-600", description: "You're taking your first steps", nextMilestone: 3 },
  { title: "Early Learner", color: "text-orange-500", description: "Building momentum", nextMilestone: 4 },
  { title: "Getting Into It", color: "text-orange-600", description: "You're developing interest", nextMilestone: 5 },
  { title: "Active Learner", color: "text-yellow-500", description: "You're actively engaging", nextMilestone: 6 },
  { title: "Regular User", color: "text-yellow-600", description: "Building consistent habits", nextMilestone: 7 },
  { title: "Consistent", color: "text-green-500", description: "Developing consistency", nextMilestone: 8 },
  { title: "Dedicated", color: "text-green-600", description: "Building solid habits", nextMilestone: 9 },
  { title: "Very Dedicated", color: "text-blue-600", description: "Strong commitment", nextMilestone: 10 },
  { title: "Highly Committed", color: "text-blue-600", description: "Impressive dedication", nextMilestone: 11 },
  { title: "Practice Master", color: "text-purple-600", description: "Mastered consistent practice", nextMilestone: 12 },
  { title: "Ultra Dedicated", color: "text-purple-600", description: "Extraordinary commitment", nextMilestone: 13 },
  { title: "App Legend", color: "text-amber-500", description: "Legendary status achieved!", nextMilestone: 14 },
  { title: "Ultimate Master", color: "text-amber-500", description: "You've transcended!", nextMilestone: 15 },
  { title: "Phrase God", color: "text-amber-500", description: "Beyond legendary!", nextMilestone: 0 }
];

/**
 * Get rank information for total phrases listened
 * @param totalPhrases - Total number of phrases listened to
 * @param debugMode - Whether to use debug thresholds (1-15 phrases) or production thresholds
 */
export function getPhraseRankTitle(totalPhrases: number, debugMode: boolean = false): RankInfo {
  if (debugMode) {
    // Debug mode: use simplified thresholds for easy testing
    for (let i = DEBUG_MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPhrases >= DEBUG_MILESTONE_THRESHOLDS[i]) {
        return {
          ...DEBUG_PHRASE_RANKS[i],
          nextMilestone: i < DEBUG_MILESTONE_THRESHOLDS.length - 1 ? DEBUG_MILESTONE_THRESHOLDS[i + 1] : 0
        };
      }
    }
    
    return {
      ...DEBUG_PHRASE_RANKS[0],
      nextMilestone: DEBUG_MILESTONE_THRESHOLDS[0]
    };
  }

  // Production mode: use real thresholds
  for (const rank of PRODUCTION_PHRASE_RANKS) {
    if (totalPhrases >= rank.threshold) {
      return {
        title: rank.title,
        color: rank.color,
        nextMilestone: rank.nextMilestone,
        description: rank.description
      };
    }
  }

  // Fallback (should never reach here due to threshold: 0 entry)
  return PRODUCTION_PHRASE_RANKS[PRODUCTION_PHRASE_RANKS.length - 1];
}

// Language-specific ranking system
const LANGUAGE_RANKS: Array<{ threshold: number } & RankInfo> = [
  { threshold: 15000, title: "Extremely Dedicated", color: "text-amber-500", nextMilestone: 0, description: "Your dedication to this language is extraordinary" },
  { threshold: 10000, title: "Highly Dedicated", color: "text-purple-600", nextMilestone: 15000, description: "You're deeply committed to practicing this language" },
  { threshold: 7500, title: "Very Dedicated", color: "text-blue-600", nextMilestone: 10000, description: "You're showing strong commitment to this language" },
  { threshold: 5000, title: "Dedicated", color: "text-green-600", nextMilestone: 7500, description: "You're building solid practice habits in this language" },
  { threshold: 3000, title: "Consistent", color: "text-green-500", nextMilestone: 5000, description: "You're developing consistent practice in this language" },
  { threshold: 1500, title: "Regular", color: "text-yellow-600", nextMilestone: 3000, description: "You're practicing this language regularly" },
  { threshold: 750, title: "Active", color: "text-yellow-500", nextMilestone: 1500, description: "You're actively practicing this language" },
  { threshold: 300, title: "Getting Into It", color: "text-orange-600", nextMilestone: 750, description: "You're developing interest in this language" },
  { threshold: 100, title: "New to This", color: "text-orange-500", nextMilestone: 300, description: "You're just starting to explore this language" },
  { threshold: 0, title: "First Time", color: "text-gray-600", nextMilestone: 100, description: "Your first steps with this language" }
];

/**
 * Get rank information for individual language practice
 * @param count - Number of phrases practiced in this language
 */
export function getLanguageRankTitle(count: number): RankInfo {
  for (const rank of LANGUAGE_RANKS) {
    if (count >= rank.threshold) {
      return {
        title: rank.title,
        color: rank.color,
        nextMilestone: rank.nextMilestone,
        description: rank.description
      };
    }
  }

  // Fallback (should never reach here due to threshold: 0 entry)
  return LANGUAGE_RANKS[LANGUAGE_RANKS.length - 1];
}