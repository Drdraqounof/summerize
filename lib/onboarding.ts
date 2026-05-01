export interface OnboardingAnswers {
  reason: string;
  hasUsedSimilarApps: string;
  selectedFocusAreas: string[];
  customFocus: string;
}

export interface FocusAreaOption {
  id: string;
  question: string;
  label: string;
  description: string;
  signals: string[];
}

export const focusAreaOptions: FocusAreaOption[] = [
  {
    id: "shopping",
    question: "Do you like shopping?",
    label: "Shopping deals",
    description: "Track groceries, loyalty offers, coupons, flash sales, and order updates.",
    signals: ["grocery", "promotion", "discount", "coupon", "sale", "order"],
  },
  {
    id: "bills",
    question: "Do you want bills and due dates flagged?",
    label: "Bills and payments",
    description: "Catch invoices, payment reminders, renewal notices, and account alerts.",
    signals: ["invoice", "bill", "payment due", "renewal", "statement"],
  },
  {
    id: "travel",
    question: "Do you travel often?",
    label: "Travel plans",
    description: "Pull out flight changes, hotel bookings, ride receipts, and itinerary emails.",
    signals: ["flight", "hotel", "booking", "trip", "itinerary"],
  },
  {
    id: "work",
    question: "Do you want work messages separated fast?",
    label: "Work and clients",
    description: "Highlight client requests, project updates, meeting notes, and team follow-ups.",
    signals: ["client", "meeting", "project", "deadline", "team"],
  },
  {
    id: "family",
    question: "Do you want family and school updates noticed?",
    label: "Family and school",
    description: "Watch for school reminders, family plans, event invites, and shared updates.",
    signals: ["school", "family", "event", "reminder", "invite"],
  },
  {
    id: "health",
    question: "Should health reminders stand out?",
    label: "Health and appointments",
    description: "Spot prescriptions, doctor visits, lab results, and appointment confirmations.",
    signals: ["appointment", "doctor", "prescription", "clinic", "results"],
  },
];

export function getFocusAreaLabels(selectedFocusAreas: string[]): string[] {
  return selectedFocusAreas
    .map((focusId) => focusAreaOptions.find((option) => option.id === focusId)?.label)
    .filter((label): label is string => Boolean(label));
}

export function getFocusAreaPromptSummary(selectedFocusAreas: string[]): string[] {
  return selectedFocusAreas
    .map((focusId) => focusAreaOptions.find((option) => option.id === focusId))
    .filter((option): option is FocusAreaOption => Boolean(option))
    .map(
      (option) =>
        `${option.label}: look for ${option.signals.join(", ")}`,
    );
}