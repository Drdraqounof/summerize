const SESSION_KEYS = [
  "emailUser",
  "emails",
  "onboardingAnswers",
  "emailConnectionProvider",
  "connectedAccount",
] as const;

export function getSessionItem(key: (typeof SESSION_KEYS)[number]) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(key);
}

export function setSessionItem(key: (typeof SESSION_KEYS)[number], value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, value);
}

export function removeSessionItem(key: (typeof SESSION_KEYS)[number]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}

export function clearLegacyLocalSession() {
  if (typeof window === "undefined") {
    return;
  }

  SESSION_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
}