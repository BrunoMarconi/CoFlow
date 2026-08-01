export interface OnboardingAnswers {
  cleanliness: string;
  dishes: string;
  common_objects: string;
  noise: string;
  visits: string;
  sleepovers: string;
  wake_up: string;
  night_noise: string;
  smoking: string;
  alcohol: string;
  pets: string;
  bills: string;
  food: string;
  communication: string;
  conflicts: string;
  rules: string;
  culture: string;
  space: string;
  lifestyle: string;
}

export interface OnboardingResponse extends OnboardingAnswers {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
