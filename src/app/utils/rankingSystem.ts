// Shared ranking system for phrase milestones and stats display

export interface RankInfo {
  title: string;
  color: string;
  nextMilestone: number;
  description: string;
}

// Production milestone thresholds and their corresponding rank info
export const PRODUCTION_PHRASE_RANKS: Array<{ threshold: number } & RankInfo> =
  [
    {
      threshold: 100000,
      title: "Shadow Deity",
      color: "text-amber-500",
      nextMilestone: 0,
      description: "You shattered the counter. Divine shadowing energy.",
    },
    {
      threshold: 75000,
      title: "Unstoppable Force",
      color: "text-purple-600",
      nextMilestone: 100000,
      description: "Your streak intimidates procrastination.",
    },
    {
      threshold: 50000,
      title: "Practice Grandmaster",
      color: "text-purple-600",
      nextMilestone: 75000,
      description: "Consistency so sharp it cuts excuses.",
    },
    {
      threshold: 40000,
      title: "Precision Artisan",
      color: "text-blue-700",
      nextMilestone: 50000,
      description: "You sculpt fluency with precision.",
    },
    {
      threshold: 35000,
      title: "Language Virtuoso",
      color: "text-blue-700",
      nextMilestone: 40000,
      description: "A virtuoso turning sound into speech.",
    },
    {
      threshold: 30000,
      title: "Rhythm Commander",
      color: "text-blue-600",
      nextMilestone: 35000,
      description: "You lead every session with perfect tempo.",
    },
    {
      threshold: 25000,
      title: "Fluency Hunter",
      color: "text-blue-600",
      nextMilestone: 30000,
      description: "Relentlessly chasing clarity, one phrase at a time.",
    },
    {
      threshold: 20000,
      title: "Seasoned Pro",
      color: "text-green-700",
      nextMilestone: 25000,
      description: "Habits forged, skills honed.",
    },
    {
      threshold: 15000,
      title: "Relentless Practitioner",
      color: "text-green-600",
      nextMilestone: 20000,
      description: "Discipline meets momentum.",
    },
    {
      threshold: 12500,
      title: "Metronome Mode",
      color: "text-green-600",
      nextMilestone: 15000,
      description: "Tick-tock, practice never stops.",
    },
    {
      threshold: 10000,
      title: "Consistency Machine",
      color: "text-green-600",
      nextMilestone: 12500,
      description: "Your routine runs like clockwork.",
    },
    {
      threshold: 7500,
      title: "Reliable Engine",
      color: "text-green-500",
      nextMilestone: 10000,
      description: "You keep the practice train rolling.",
    },
    {
      threshold: 5000,
      title: "Habit Builder",
      color: "text-yellow-600",
      nextMilestone: 7500,
      description: "Brick by brick, habit by habit.",
    },
    {
      threshold: 3500,
      title: "Locked-In Learner",
      color: "text-yellow-600",
      nextMilestone: 5000,
      description: "Focus on, distractions out.",
    },
    {
      threshold: 2500,
      title: "Momentum Maker",
      color: "text-yellow-500",
      nextMilestone: 3500,
      description: "You show up and it shows.",
    },
    {
      threshold: 1500,
      title: "Routine Rookie",
      color: "text-orange-600",
      nextMilestone: 2500,
      description: "Found the groove - now keep it.",
    },
    {
      threshold: 1000,
      title: "Finding Your Groove",
      color: "text-orange-600",
      nextMilestone: 1500,
      description: "The rhythm is kicking in.",
    },
    {
      threshold: 750,
      title: "Early Spark",
      color: "text-orange-500",
      nextMilestone: 1000,
      description: "Ignition achieved - keep the flame alive.",
    },
    {
      threshold: 500,
      title: "Fresh Explorer",
      color: "text-orange-500",
      nextMilestone: 750,
      description: "Map in hand, journey begun.",
    },
    {
      threshold: 250,
      title: "Booting Up",
      color: "text-gray-600",
      nextMilestone: 500,
      description: "Systems online. Language loading.",
    },
    {
      threshold: 100,
      title: "Shadow Initiate",
      color: "text-gray-500",
      nextMilestone: 250,
      description: "First steps into shadowing territory.",
    },
    {
      threshold: 50,
      title: "Day One Energy",
      color: "text-gray-500",
      nextMilestone: 100,
      description: "Small steps, strong start.",
    },
    {
      threshold: 25,
      title: "Brand-New Brainwaves",
      color: "text-gray-400",
      nextMilestone: 50,
      description: "New neurons, who dis?",
    },
    {
      threshold: 10,
      title: "First Shadow",
      color: "text-gray-400",
      nextMilestone: 25,
      description: "Your first phrase rings out.",
    },
    {
      threshold: 0,
      title: "Welcome Aboard",
      color: "text-gray-500",
      nextMilestone: 10,
      description: "Every tap counts. Let's go.",
    },
  ];

// Debug mode settings
export const DEBUG_MILESTONE_THRESHOLDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

const DEBUG_PHRASE_RANKS: Array<RankInfo> = [
  {
    title: "Welcome Aboard",
    color: "text-gray-500",
    description: "Every tap counts",
    nextMilestone: 2,
  },
  {
    title: "First Echo",
    color: "text-gray-600",
    description: "Nice repeat",
    nextMilestone: 3,
  },
  {
    title: "Early Spark",
    color: "text-orange-500",
    description: "Ignition achieved",
    nextMilestone: 4,
  },
  {
    title: "Finding Your Groove",
    color: "text-orange-600",
    description: "Rhythm incoming",
    nextMilestone: 5,
  },
  {
    title: "Momentum Maker",
    color: "text-yellow-500",
    description: "You show up",
    nextMilestone: 6,
  },
  {
    title: "Habit Builder",
    color: "text-yellow-600",
    description: "Consistency forming",
    nextMilestone: 7,
  },
  {
    title: "Reliable Engine",
    color: "text-green-500",
    description: "Keeps rolling",
    nextMilestone: 8,
  },
  {
    title: "Metronome Mode",
    color: "text-green-600",
    description: "Tick-tock",
    nextMilestone: 9,
  },
  {
    title: "Relentless",
    color: "text-blue-600",
    description: "Discipline rising",
    nextMilestone: 10,
  },
  {
    title: "Precision Artisan",
    color: "text-blue-600",
    description: "Sharper practice",
    nextMilestone: 11,
  },
  {
    title: "Practice Grandmaster",
    color: "text-purple-600",
    description: "Consistency that cuts excuses",
    nextMilestone: 12,
  },
  {
    title: "Unstoppable Force",
    color: "text-purple-600",
    description: "Extraordinary commitment",
    nextMilestone: 13,
  },
  {
    title: "Shadow Legend",
    color: "text-amber-500",
    description: "Legendary status achieved",
    nextMilestone: 14,
  },
  {
    title: "Grandmaster",
    color: "text-amber-500",
    description: "You've transcended",
    nextMilestone: 15,
  },
  {
    title: "Shadow Deity",
    color: "text-amber-500",
    description: "Beyond legendary",
    nextMilestone: 0,
  },
];

/**
 * Get rank information for total phrases listened
 * @param totalPhrases - Total number of phrases listened to
 * @param debugMode - Whether to use debug thresholds (1-15 phrases) or production thresholds
 */
export function getPhraseRankTitle(
  totalPhrases: number,
  debugMode: boolean = false
): RankInfo {
  if (debugMode) {
    // Debug mode: use simplified thresholds for easy testing
    for (let i = DEBUG_MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPhrases >= DEBUG_MILESTONE_THRESHOLDS[i]) {
        return {
          ...DEBUG_PHRASE_RANKS[i],
          nextMilestone:
            i < DEBUG_MILESTONE_THRESHOLDS.length - 1
              ? DEBUG_MILESTONE_THRESHOLDS[i + 1]
              : 0,
        };
      }
    }

    return {
      ...DEBUG_PHRASE_RANKS[0],
      nextMilestone: DEBUG_MILESTONE_THRESHOLDS[0],
    };
  }

  // Production mode: use real thresholds
  for (const rank of PRODUCTION_PHRASE_RANKS) {
    if (totalPhrases >= rank.threshold) {
      return {
        title: rank.title,
        color: rank.color,
        nextMilestone: rank.nextMilestone,
        description: rank.description,
      };
    }
  }

  // Fallback (should never reach here due to threshold: 0 entry)
  return PRODUCTION_PHRASE_RANKS[PRODUCTION_PHRASE_RANKS.length - 1];
}

// Language-specific ranking system
const LANGUAGE_RANKS: Array<{ threshold: number } & RankInfo> = [
  {
    threshold: 50000,
    title: "Language Deity",
    color: "text-amber-500",
    nextMilestone: 0,
    description: "Transcendent mastery. You've become one with the language.",
  },
  {
    threshold: 40000,
    title: "Eternal Echo",
    color: "text-amber-500",
    nextMilestone: 50000,
    description: "Your voice echoes through time. Legendary dedication.",
  },
  {
    threshold: 30000,
    title: "Golden Tongue",
    color: "text-amber-500",
    nextMilestone: 40000,
    description: "Every word is gold. You've achieved linguistic perfection.",
  },
  {
    threshold: 25000,
    title: "Shadow Sovereign",
    color: "text-amber-500",
    nextMilestone: 30000,
    description: "Reigning supreme over this language domain.",
  },
  {
    threshold: 20000,
    title: "Linguistic Luminary",
    color: "text-amber-500",
    nextMilestone: 25000,
    description: "A shining beacon of language mastery.",
  },
  {
    threshold: 15000,
    title: "Divine Practitioner",
    color: "text-amber-500",
    nextMilestone: 20000,
    description: "Divine commitment to this language.",
  },
  {
    threshold: 10000,
    title: "Fluency Fanatic",
    color: "text-purple-600",
    nextMilestone: 15000,
    description: "Deep-in-the-weeds commitment to this language.",
  },
  {
    threshold: 7500,
    title: "Grammar Gladiator",
    color: "text-blue-600",
    nextMilestone: 10000,
    description: "Battling nuance with style.",
  },
  {
    threshold: 5000,
    title: "Steady Strider",
    color: "text-green-600",
    nextMilestone: 7500,
    description: "Solid, repeatable reps.",
  },
  {
    threshold: 3000,
    title: "Rhythm Keeper",
    color: "text-green-500",
    nextMilestone: 5000,
    description: "You keep the beat in this language.",
  },
  {
    threshold: 1500,
    title: "Frequent Flyer",
    color: "text-yellow-600",
    nextMilestone: 3000,
    description: "You visit this language often.",
  },
  {
    threshold: 750,
    title: "Warm-Up Warrior",
    color: "text-yellow-500",
    nextMilestone: 1500,
    description: "Muscles primed, brain engaged.",
  },
  {
    threshold: 300,
    title: "Curiosity Mode",
    color: "text-orange-600",
    nextMilestone: 750,
    description: "Interest becoming habit.",
  },
  {
    threshold: 100,
    title: "Fresh Tracks",
    color: "text-orange-500",
    nextMilestone: 300,
    description: "First footprints in this language.",
  },
  {
    threshold: 0,
    title: "Boot Sequence",
    color: "text-gray-600",
    nextMilestone: 100,
    description: "Launching your language journey.",
  },
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
        description: rank.description,
      };
    }
  }

  // Fallback (should never reach here due to threshold: 0 entry)
  return LANGUAGE_RANKS[LANGUAGE_RANKS.length - 1];
}
