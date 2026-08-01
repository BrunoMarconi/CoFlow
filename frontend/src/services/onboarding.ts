import { api } from "./api";
import type { OnboardingAnswers, OnboardingResponse } from "@/types/onboarding";

export async function saveOnboarding(data: OnboardingAnswers) {
  const { data: response } = await api.post<OnboardingResponse>(
    "/onboarding",
    data
  );
  return response;
}

export async function getMyOnboarding() {
  const { data } = await api.get<OnboardingResponse>("/onboarding/me");
  return data;
}
