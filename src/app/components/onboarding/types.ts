import { PresentationConfig } from '../../types';

export interface OnboardingData {
  dreamOutcomes: string[];
  painPoints: string[];
  practiceTime?: string;
  nativeLanguage: string;
  targetLanguage: string;
  abilityLevel: string;
  interests: string[];
  email?: string;
  accountType?: string;
  selectedPlan?: string;
  dailyGoal?: string;
  defaultPresentationConfig?: Partial<PresentationConfig>;
}
