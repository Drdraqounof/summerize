"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { type Email, useEmail } from "../providers";
import EmailList from "../components/EmailList";
import EmailDetail from "../components/EmailDetail";
import ConversationSidebar from "../components/ConversationSidebar";
import InboxFilterBar, { type InboxFilterValue } from "../components/InboxFilterBar";
import AppLayout from "../components/AppLayout";
import { getSessionItem } from "@/lib/client-session";
import {
  getFocusAreaOptionsById,
  matchesFocusArea,
} from "@/lib/onboarding";

const NOTIFICATION_STORAGE_KEY = "mailturtleNotificationState";
const INBOX_FILTER_STORAGE_KEY = "mailturtleInboxFilter";

const cadenceDurations: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

interface NotificationState {
  lastDigestAt?: string;
  deliveredEmailIds?: string[];
}

interface SessionSnapshot {
  savedProvider: string | null;
  savedUser: string | null;
}

function logInboxHydrationIssue(
  message: string,
  details: {
    connectedAccountEmail?: string | null;
    connectionProvider?: string | null;
    savedProvider?: string | null;
    savedUser?: string | null;
    user?: string | null;
  },
) {
  console.warn("[Inbox hydration] " + message, details);
}

function readNotificationState(): NotificationState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotificationState) : {};
  } catch (error) {
    console.error("Failed to read notification state:", error);
    return {};
  }
}

function saveNotificationState(state: NotificationState) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(state));
}

function getCadenceLabel(cadence?: string) {
  if (!cadence) {
    return "Instant";
  }

  return cadence.charAt(0).toUpperCase() + cadence.slice(1);
}

function readStoredInboxFilter(): InboxFilterValue | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(INBOX_FILTER_STORAGE_KEY);
  } catch (error) {
    console.warn("[Inbox filter] Failed to read stored inbox filter", error);
    return null;
  }
}

function saveStoredInboxFilter(value: InboxFilterValue) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(INBOX_FILTER_STORAGE_KEY, value);
  } catch (error) {
    console.warn("[Inbox filter] Failed to save inbox filter", error);
  }
}

function getDefaultInboxFilter(
  assistantStyle: string | undefined,
  selectedFocusAreas: string[],
): InboxFilterValue {
  if (assistantStyle === "priority-only") {
    return "important";
  }

  if (selectedFocusAreas.length > 0) {
    return selectedFocusAreas[0];
  }

  return "important";
}

export default function InboxPage() {
  const router = useRouter();
  const { user, emails, connectionProvider, connectedAccount, onboardingAnswers } = useEmail();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [digestEmails, setDigestEmails] = useState<Email[]>([]);
  const [digestReady, setDigestReady] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState<SessionSnapshot>({
    savedProvider: null,
    savedUser: null,
  });
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<InboxFilterValue>("important");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );
  const activeDigestIdsRef = useRef<string[]>([]);
  const selectedFocusAreas = onboardingAnswers?.selectedFocusAreas ?? [];
  const selectedFocusOptions = getFocusAreaOptionsById(selectedFocusAreas);
  const isLoading = !hasHydrated || !sessionSnapshot.savedUser || !sessionSnapshot.savedProvider;
  const notificationFrequency = onboardingAnswers?.notificationFrequency ?? "daily";

  console.log("📄 PAGE: Inbox page loaded");
  console.log("📄 user from context:", user);
  console.log("📄 emails:", emails);

  useEffect(() => {
    const snapshot = {
      savedProvider: getSessionItem("emailConnectionProvider"),
      savedUser: getSessionItem("emailUser"),
    };

    setSessionSnapshot(snapshot);
    setHasHydrated(true);

    console.info("[Inbox hydration] Client session snapshot captured", {
      hasConnectedAccount: Boolean(connectedAccount?.email),
      savedProvider: snapshot.savedProvider,
      savedUser: snapshot.savedUser,
    });

    if (!snapshot.savedUser || !snapshot.savedProvider) {
      logInboxHydrationIssue("Missing session data after hydration", {
        connectedAccountEmail: connectedAccount?.email ?? null,
        connectionProvider,
        savedProvider: snapshot.savedProvider,
        savedUser: snapshot.savedUser,
        user,
      });
    }

    // Check authentication on mount
    const savedUser = getSessionItem("emailUser");
    const savedProvider = getSessionItem("emailConnectionProvider");
    console.log("📧 Inbox: Checking authentication...");
    console.log("📧 Saved user:", savedUser);
    
    if (!savedUser) {
      // Not logged in, redirect to login
      console.log("❌ Not able to sign in: No user in localStorage, redirecting to /login");
      router.replace("/login");
    } else if (!savedProvider) {
      console.log("⚠️ No connected provider selected, redirecting to /connect");
      router.replace("/connect");
    } else {
      // Logged in, finish loading
      console.log("✅ User authenticated:", savedUser);
      console.log("✅ INBOX PAGE SUCCESSFULLY DETECTED - User can now see emails");
    }
  }, [connectedAccount?.email, connectionProvider, router, user]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (sessionSnapshot.savedUser && user && sessionSnapshot.savedUser !== user) {
      logInboxHydrationIssue("Session user does not match provider user", {
        connectedAccountEmail: connectedAccount?.email ?? null,
        connectionProvider,
        savedProvider: sessionSnapshot.savedProvider,
        savedUser: sessionSnapshot.savedUser,
        user,
      });
    }

    if (
      sessionSnapshot.savedProvider
      && connectionProvider
      && sessionSnapshot.savedProvider !== connectionProvider
    ) {
      logInboxHydrationIssue("Session provider does not match provider state", {
        connectedAccountEmail: connectedAccount?.email ?? null,
        connectionProvider,
        savedProvider: sessionSnapshot.savedProvider,
        savedUser: sessionSnapshot.savedUser,
        user,
      });
    }
  }, [
    connectedAccount?.email,
    connectionProvider,
    hasHydrated,
    sessionSnapshot.savedProvider,
    sessionSnapshot.savedUser,
    user,
  ]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (selectedFocusAreas.length === 0) {
      console.info("[Inbox filter] No saved focus areas found, defaulting to matched emails");
    }

    setActiveFilter((currentFilter) => {
      const availableFilters = new Set<InboxFilterValue>([
        "important",
        ...selectedFocusAreas,
      ]);
      const storedFilter = readStoredInboxFilter();

      if (availableFilters.has(currentFilter)) {
        return currentFilter;
      }

      if (storedFilter && availableFilters.has(storedFilter)) {
        return storedFilter;
      }

      return getDefaultInboxFilter(onboardingAnswers?.assistantStyle, selectedFocusAreas);
    });
  }, [hasHydrated, onboardingAnswers?.assistantStyle, selectedFocusAreas]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveStoredInboxFilter(activeFilter);
  }, [activeFilter, hasHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (emails.length === 0) {
      setDigestEmails([]);
      setDigestReady(false);
      return;
    }

    const cadenceDuration = cadenceDurations[notificationFrequency] ?? cadenceDurations.daily;
    const notificationState = readNotificationState();
    const deliveredEmailIds = new Set(notificationState.deliveredEmailIds ?? []);
    const lastDigestAt = notificationState.lastDigestAt
      ? new Date(notificationState.lastDigestAt).getTime()
      : 0;
    const now = Date.now();
    const flaggedEmails = emails
      .filter((email) => email.shouldNotify)
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );
    const pendingEmails = flaggedEmails.filter((email) => !deliveredEmailIds.has(email.id));
    const digestDue = lastDigestAt === 0 || now - lastDigestAt >= cadenceDuration;

    if (!digestDue || pendingEmails.length === 0) {
      const activeEmails = flaggedEmails.filter((email) => activeDigestIdsRef.current.includes(email.id));

      if (activeEmails.length > 0) {
        setDigestReady(true);
        setDigestEmails(activeEmails);
      } else {
        activeDigestIdsRef.current = [];
        setDigestReady(false);
        setDigestEmails([]);
      }

      return;
    }

    activeDigestIdsRef.current = pendingEmails.map((email) => email.id);
    setDigestReady(true);
    setDigestEmails(pendingEmails);

    const updatedState: NotificationState = {
      lastDigestAt: new Date(now).toISOString(),
      deliveredEmailIds: [...deliveredEmailIds, ...pendingEmails.map((email) => email.id)],
    };
    saveNotificationState(updatedState);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      const digestTitle = `${pendingEmails.length} email${pendingEmails.length === 1 ? "" : "s"} matched your watchlist`;
      const digestBody = pendingEmails
        .slice(0, 2)
        .map((email) => email.subject)
        .join(" | ");

      new Notification(digestTitle, {
        body: digestBody || `Your ${notificationFrequency} digest is ready in Mailturtle.`,
      });
    }
  }, [emails, notificationFrequency]);

  const visibleEmails = emails.filter((email) => {
    if (activeFilter === "important") {
      return Boolean(email.isStarred);
    }

    const focusOption = selectedFocusOptions.find((option) => option.id === activeFilter);
    if (!focusOption) {
      return true;
    }

    return matchesFocusArea(email, focusOption);
  });

  useEffect(() => {
    if (visibleEmails.length === 0) {
      console.info("[Inbox filter] Active filter returned no emails", {
        activeFilter,
        totalEmails: emails.length,
      });
    }
  }, [activeFilter, emails.length, visibleEmails.length]);

  useEffect(() => {
    if (selectedEmailId && !visibleEmails.some((email) => email.id === selectedEmailId)) {
      setSelectedEmailId(visibleEmails[0]?.id ?? null);
    }
  }, [selectedEmailId, visibleEmails]);

  const selectedEmail: Email | undefined = visibleEmails.find((e) => e.id === selectedEmailId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  return (
    <AppLayout>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-2xl shrink-0">{String.fromCodePoint(0x1F4E7)}</div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Email Checker</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{user}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {notificationPermission === "default" ? (
              <button
                onClick={requestNotificationPermission}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-medium transition whitespace-nowrap"
              >
                Enable alerts
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] bg-white border-r border-gray-200 overflow-y-auto flex flex-col ${
            selectedEmailId && "hidden md:flex md:flex-col"
          }`}
        >
          {/* Sidebar Header - Filter Bar & Watchlist */}
          <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            {/* Title and Count */}
            <div>
              <h2 className="font-bold text-gray-900">Inbox</h2>
              <p className="text-sm text-gray-600">
                {visibleEmails.length} of {emails.length} emails
              </p>
            </div>

            {/* Filter Pills - Replaces dropdowns */}
            <InboxFilterBar
              activeFilter={activeFilter}
              availableFocusAreas={selectedFocusOptions}
              onChange={setActiveFilter}
              totalCount={emails.length}
              visibleCount={visibleEmails.length}
            />

            {/* Digest Banner - Single-purpose ribbon */}
            {digestReady && digestEmails.length > 0 ? (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900">
                <p className="font-bold uppercase tracking-wide text-emerald-700">
                  {getCadenceLabel(notificationFrequency)} Digest
                </p>
                <p className="mt-1 text-emerald-800">
                  {digestEmails.length} email{digestEmails.length === 1 ? "" : "s"} ready
                </p>
              </div>
            ) : null}
          </div>

          {/* Email List - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <EmailList
              assistantStyle={onboardingAnswers?.assistantStyle}
              emails={visibleEmails}
              emailsToAnalyze={emails}
              emptyMessage={emails.length > 0 ? "No emails match the current filter" : "No emails yet"}
              onSelectEmail={setSelectedEmailId}
              selectedId={selectedEmailId}
            />
          </div>
        </div>

        {/* Email Detail + Sidebar */}
        {selectedEmail ? (
          <div className={`flex flex-1 overflow-hidden ${!selectedEmailId && "hidden md:flex md:flex-col"}`}>
            <div className="md:hidden absolute top-0 left-0 right-0 p-4 bg-white border-b border-gray-200 z-10">
              <button
                onClick={() => setSelectedEmailId(null)}
                className="text-blue-600 font-medium"
              >
                ← Back to Inbox
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="md:hidden pt-16" />
              <EmailDetail assistantStyle={onboardingAnswers?.assistantStyle} email={selectedEmail} />
            </div>
            <ConversationSidebar threadId={selectedEmail.threadId} userEmail={user ?? undefined} />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select an email to view</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
