import type { HostFeaturePreference } from "@prisma/client";

export type { HostFeaturePreference };

export interface AngleCandidate {
  angle: string;
  whyItWorks: string;
  recommended: boolean;
}

export interface ReferenceAnalysis {
  outlierId: string;
  mainPromise: string;
  emotion: string;
  dominantVisual: string;
  whatIsShown: string;
  whatIsHidden: string;
  repeatingPattern: string;
}

export interface TitleCandidate {
  title: string;
  triggerNote: string;
  ctrRank: number;
  isTopThree: boolean;
}

export interface ThumbnailConcept {
  mainVisualElement: string;
  facialExpression: string | null;
  colorContrastNote: string;
  withheldInfo: string;
  complementRuleNote: string;
  textOptions: string[];
}

export interface ThumbnailIdeaGenerationOutput {
  angleCandidates: AngleCandidate[];
  chosenAngle: string;
  referenceAnalysis: ReferenceAnalysis[] | null;
  titleCandidates: TitleCandidate[];
  chosenTitle: string;
  thumbnailConcept: ThumbnailConcept;
  imagePrompt: string;
}

export interface ReferenceInput {
  outlierId: string;
  title: string;
  thumbnailUrl: string | null;
}

export type IdeaSource =
  | { type: "outlier"; outlierId: string; title: string; description: string | null }
  | { type: "freeform"; text: string };

export interface BuildPromptInput {
  ideaSource: IdeaSource;
  requestedHostFeature: HostFeaturePreference;
  references: ReferenceInput[];
}
