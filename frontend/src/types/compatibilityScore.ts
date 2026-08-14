export interface CompatibilityCategoryScore {
  key: string;
  label: string;
  score: number;
  description: string;
}

export interface CompatibilityScore {
  categories: CompatibilityCategoryScore[];
}
