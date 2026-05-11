export interface OnboardingAnswers {
  hasUsedAiBefore: string;
  selectedFocusAreas: string[];
  assistantStyle: string;
  notificationFrequency: string;
}

interface OnboardingPreferenceSource {
  hasUsedAiBefore: string | null;
  focusAreas: string[];
  assistantStyle: string | null;
  notificationFrequency: string | null;
  onboardingCompleted: boolean;
}

export interface FocusAreaOption {
  id: string;
  question: string;
  label: string;
  description: string;
  signals: string[];
}

interface FilterableEmail {
  body?: string;
  category?: string;
  matchReason?: string;
  preview?: string;
  subject?: string;
  shouldNotify?: boolean;
}

export const focusAreaOptions: FocusAreaOption[] = [
  {
    id: "groceries",
    question: "Should grocery emails stand out?",
    label: "Groceries",
    description: "Catch grocery receipts, pickup notices, delivery updates, and store reminders.",
    signals: ["grocery", "instacart", "pickup", "delivery", "receipt", "store"],
  },
  {
    id: "work",
    question: "Should work email get priority?",
    label: "Work",
    description: "Highlight coworker messages, project updates, meeting notes, and client follow-ups.",
    signals: ["client", "project", "meeting", "deadline", "team", "manager"],
  },
  {
    id: "events",
    question: "Should event messages be easier to spot?",
    label: "Events",
    description: "Pull out invitations, calendars, ticket confirmations, and schedule changes.",
    signals: ["event", "invite", "ticket", "calendar", "schedule", "webinar"],
  },
  {
    id: "deals",
    question: "Do you want promotions grouped for quick review?",
    label: "Deals",
    description: "Watch for discounts, coupon drops, loyalty offers, and sale announcements.",
    signals: ["deal", "discount", "coupon", "promotion", "sale", "offer"],
  },
];

export function mapUserPreferenceToOnboardingAnswers(
  preferences: OnboardingPreferenceSource | null | undefined,
): OnboardingAnswers | null {
  if (
    !preferences?.onboardingCompleted ||
    !preferences.hasUsedAiBefore ||
    !preferences.assistantStyle ||
    !preferences.notificationFrequency
  ) {
    return null;
  }

  return {
    hasUsedAiBefore: preferences.hasUsedAiBefore,
    selectedFocusAreas: preferences.focusAreas,
    assistantStyle: preferences.assistantStyle,
    notificationFrequency: preferences.notificationFrequency,
  };
}

export function getFocusAreaLabels(selectedFocusAreas: string[]): string[] {
  return selectedFocusAreas
    .map((focusId) => focusAreaOptions.find((option) => option.id === focusId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getFocusAreaOptionsById(selectedFocusAreas: string[]): FocusAreaOption[] {
  return selectedFocusAreas
    .map((focusId) => focusAreaOptions.find((option) => option.id === focusId))
    .filter((option): option is FocusAreaOption => Boolean(option));
}

export function getFocusAreaPromptSummary(selectedFocusAreas: string[]): string[] {
  return getFocusAreaOptionsById(selectedFocusAreas)
    .map(
      (option) =>
        `${option.label}: look for ${option.signals.join(", ")}`,
    );
}

export function matchesFocusArea(email: FilterableEmail, option: FocusAreaOption): boolean {
  const searchableFields = [
    email.subject,
    email.preview,
    email.body,
    email.category,
    email.matchReason,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!searchableFields) {
    return false;
  }

  if (email.shouldNotify && searchableFields.includes(option.label.toLowerCase())) {
    return true;
  }

  return option.signals.some((signal) => searchableFields.includes(signal.toLowerCase()));
}