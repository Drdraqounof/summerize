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

export interface CustomFocusArea {
  label: string;
  keywords: string[];
}

export type GmailFolderLabel = "inbox" | "promotions" | "updates";

interface FilterableEmail {
  body?: string;
  category?: string;
  matchReason?: string;
  preview?: string;
  subject?: string;
  shouldNotify?: boolean;
}

const CUSTOM_PREFIX = "custom:";

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

const focusAreaFolderMap: Record<string, GmailFolderLabel[]> = {
  groceries: ["updates"],
  work: ["inbox"],
  events: ["updates"],
  deals: ["promotions"],
};

export function isCustomFocusAreaId(id: string): boolean {
  return id.startsWith(CUSTOM_PREFIX);
}

export function createCustomFocusAreaId(label: string, keywords: string[]): string {
  return `${CUSTOM_PREFIX}${label}:${keywords.join(",")}`;
}

export function parseCustomFocusAreaId(id: string): CustomFocusArea | null {
  if (!id.startsWith(CUSTOM_PREFIX)) return null;
  const rest = id.slice(CUSTOM_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  const label = rest.slice(0, colonIdx);
  const keywords = rest.slice(colonIdx + 1).split(",").filter(Boolean);
  return { label, keywords };
}

export function getFocusAreaOptionForId(id: string): FocusAreaOption | null {
  const predefined = focusAreaOptions.find((o) => o.id === id);
  if (predefined) return predefined;
  const custom = parseCustomFocusAreaId(id);
  if (custom) {
    return {
      id,
      question: `Should ${custom.label} emails stand out?`,
      label: custom.label,
      description: `Custom category: ${custom.label}`,
      signals: custom.keywords,
    };
  }
  return null;
}

export function getFocusAreaLabels(selectedFocusAreas: string[]): string[] {
  return selectedFocusAreas
    .map((id) => {
      const option = getFocusAreaOptionForId(id);
      return option?.label ?? null;
    })
    .filter((label): label is string => Boolean(label));
}

export function getFocusAreaOptionsById(selectedFocusAreas: string[]): FocusAreaOption[] {
  return selectedFocusAreas
    .map((id) => getFocusAreaOptionForId(id))
    .filter((option): option is FocusAreaOption => Boolean(option));
}

export function getFocusAreaPromptSummary(selectedFocusAreas: string[]): string[] {
  return getFocusAreaOptionsById(selectedFocusAreas)
    .map((option) => `${option.label}: look for ${option.signals.join(", ")}`);
}

export function getSelectedGmailLabels(selectedFocusAreas: string[]): GmailFolderLabel[] {
  const known = selectedFocusAreas.filter((id) => !isCustomFocusAreaId(id));
  const labels = known.flatMap((focusId) => focusAreaFolderMap[focusId] ?? []);
  return Array.from(new Set(labels.length > 0 ? labels : ["inbox"]));
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

  if (!searchableFields) return false;
  if (email.shouldNotify && searchableFields.includes(option.label.toLowerCase())) return true;
  return option.signals.some((signal) => searchableFields.includes(signal.toLowerCase()));
}

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
