"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  clearLegacyLocalSession,
  getSessionItem,
  removeSessionItem,
  setSessionItem,
} from "@/lib/client-session";
import {
  getFocusAreaPromptSummary,
  getSelectedGmailLabels,
  type OnboardingAnswers,
} from "@/lib/onboarding";

interface AuthResult {
  onboardingAnswers: OnboardingAnswers | null;
  hasCompletedOnboarding: boolean;
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  bodyHtml?: string;
  timestamp: Date;
  read: boolean;
  gmailLabel?: string;
  category?: string;
  summary?: string;
  analyzed?: boolean;
  shouldNotify?: boolean;
  matchReason?: string;
  isStarred?: boolean;
}

interface ConnectedAccount {
  provider: string;
  email: string;
  name?: string;
}

interface GmailApiEmail {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  bodyHtml?: string;
  date: string;
  gmailLabel?: string;
  category?: string;
  summary?: string;
  analyzed?: boolean;
  shouldNotify?: boolean;
  matchReason?: string;
  isStarred?: boolean;
}

interface GmailMessagesResponse {
  emails: GmailApiEmail[];
}

interface EmailContextType {
  emails: Email[];
  spamEmails: Email[];
  isLoggedIn: boolean;
  user: string | null;
  onboardingAnswers: OnboardingAnswers | null;
  connectionProvider: string | null;
  connectedAccount: ConnectedAccount | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name?: string) => Promise<AuthResult>;
  logout: () => void;
  markAsRead: (id: string) => void;
  addEmail: (email: Email) => void;
  analyzeEmail: (id: string) => Promise<void>;
  batchAnalyzeEmails: (emails: Email[]) => Promise<void>;
  saveOnboardingAnswers: (answers: OnboardingAnswers) => Promise<void>;
  saveConnectionProvider: (provider: string) => void;
  saveConnectedAccount: (account: ConnectedAccount) => void;
  loadGmailEmails: (email: string) => Promise<void>;
  loadSpamEmails: (email: string) => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const sampleEmails: Email[] = [
  {
    id: "1",
    from: "noreply@example.com",
    subject: "Welcome to Mailturtle",
    preview: "Thanks for creating your account...",
    body: "Welcome to Mailturtle. Connect your inbox to start AI-powered triage.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: "2",
    from: "notifications@example.com",
    subject: "Your account is ready",
    preview: "Your workspace is ready for onboarding.",
    body: "Your account has been created successfully. Continue to onboarding to set up your AI preferences.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
];

function dedupeEmailsById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [spamEmails, setSpamEmails] = useState<Email[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);
  const [connectionProvider, setConnectionProvider] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);

  useEffect(() => {
    // Only run on client after hydration
    clearLegacyLocalSession();

    const savedUser = getSessionItem("emailUser");
    const savedEmails = getSessionItem("emails");
    const savedAnswers = getSessionItem("onboardingAnswers");
    const savedProvider = getSessionItem("emailConnectionProvider");
    const savedConnectedAccount = getSessionItem("connectedAccount");

    if (savedUser) {
      setUser(savedUser);
      setIsLoggedIn(true);
    }

    if (savedEmails) {
      setEmails(dedupeEmailsById(JSON.parse(savedEmails) as Email[]));
    }

    if (savedAnswers) {
      setOnboardingAnswers(JSON.parse(savedAnswers));
    }

    if (savedProvider) {
      setConnectionProvider(savedProvider);
    }

    if (savedConnectedAccount) {
      setConnectedAccount(JSON.parse(savedConnectedAccount));
    }
  }, []);

  const hydrateSignedInUser = (email: string, answers: OnboardingAnswers | null) => {
    setUser(email);
    setIsLoggedIn(true);
    setSessionItem("emailUser", email);
    setOnboardingAnswers(answers);

    if (answers) {
      setSessionItem("onboardingAnswers", JSON.stringify(answers));
    } else {
      removeSessionItem("onboardingAnswers");
    }

    const initialEmails = dedupeEmailsById(sampleEmails);
    setEmails(initialEmails);
    setSessionItem("emails", JSON.stringify(initialEmails));
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      user?: { email: string };
      onboardingAnswers?: OnboardingAnswers | null;
      hasCompletedOnboarding?: boolean;
    };

    if (!response.ok || !data.user) {
      throw new Error(data.error || "Unable to sign in.");
    }

    hydrateSignedInUser(data.user.email, data.onboardingAnswers ?? null);

    return {
      onboardingAnswers: data.onboardingAnswers ?? null,
      hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
    };
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string; user?: { email: string } };

    if (!response.ok || !data.user) {
      throw new Error(data.error || "Unable to create account.");
    }

    hydrateSignedInUser(data.user.email, null);

    return {
      onboardingAnswers: null,
      hasCompletedOnboarding: false,
    };
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setEmails([]);
    setOnboardingAnswers(null);
    setConnectionProvider(null);
    setConnectedAccount(null);
    removeSessionItem("emailUser");
    removeSessionItem("emails");
    removeSessionItem("onboardingAnswers");
    removeSessionItem("emailConnectionProvider");
    removeSessionItem("connectedAccount");
  };

  const markAsRead = (id: string) => {
    const updated = dedupeEmailsById(emails.map((e) =>
      e.id === id ? { ...e, read: true } : e
    ));
    setEmails(updated);
    setSessionItem("emails", JSON.stringify(updated));

    const updatedSpam = dedupeEmailsById(spamEmails.map((e) =>
      e.id === id ? { ...e, read: true } : e
    ));
    setSpamEmails(updatedSpam);
  };

  const addEmail = (email: Email) => {
    const updated = dedupeEmailsById([email, ...emails]);
    setEmails(updated);
    setSessionItem("emails", JSON.stringify(updated));
  };

  const saveOnboardingAnswers = async (answers: OnboardingAnswers) => {
    if (!user) {
      throw new Error("Sign in again before saving onboarding answers.");
    }

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user, answers }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Unable to save onboarding answers.");
    }

    setOnboardingAnswers(answers);
    setSessionItem("onboardingAnswers", JSON.stringify(answers));
  };

  const saveConnectionProvider = useCallback((provider: string) => {
    setConnectionProvider(provider);
    setSessionItem("emailConnectionProvider", provider);
  }, []);

  const loadGmailEmails = useCallback(async (email: string, userEmailOverride?: string) => {
    try {
      console.log("[Providers] Loading Gmail emails for:", email);
      
      const resolvedUserEmail = userEmailOverride ?? user;
      const labels = getSelectedGmailLabels(onboardingAnswers?.selectedFocusAreas ?? []);
      const folderFetches = labels.map(async (label) => {
        const searchParams = new URLSearchParams({
          email,
          label,
        });

        if (resolvedUserEmail) {
          searchParams.set("userEmail", resolvedUserEmail);
        }

        const response = await fetch(`/api/gmail/messages?${searchParams.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[Providers] Failed to load ${label} folder: ${errorData.error || `Status ${response.status}`}`);
          return [];
        }

        const data: GmailMessagesResponse = await response.json();
        return data.emails || [];
      });

      const folderResults = await Promise.all(folderFetches);
      const allEmails = folderResults.flat();
      const uniqueEmails = Array.from(
        new Map(allEmails.map((emailRecord) => [emailRecord.id, emailRecord])).values()
      );

      const gmailEmails: Email[] = uniqueEmails.map((emailRecord) => ({
        ...emailRecord,
        timestamp: new Date(emailRecord.date),
        read: false,
        bodyHtml: emailRecord.bodyHtml,
        gmailLabel: emailRecord.gmailLabel,
        category: emailRecord.category,
        summary: emailRecord.summary,
        analyzed: emailRecord.analyzed || false,
        shouldNotify: emailRecord.shouldNotify,
        matchReason: emailRecord.matchReason,
        isStarred: emailRecord.isStarred,
      }));

      // Sort starred first, then by timestamp descending
      gmailEmails.sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setEmails(gmailEmails);
      setSessionItem("emails", JSON.stringify(gmailEmails));
      console.log("[Providers] Successfully loaded", gmailEmails.length, "unique emails from Gmail across selected folders", labels);
    } catch (error) {
      console.error("[Providers] Error loading Gmail emails:", error);
      // Keep sample emails if Gmail fetch fails
    }
  }, [onboardingAnswers?.selectedFocusAreas, user]);

  const loadSpamEmails = useCallback(async (email: string) => {
    try {
      const resolvedUserEmail = user;
      const spamLabels = ["spam", "trash"];
      const folderFetches = spamLabels.map(async (label) => {
        const searchParams = new URLSearchParams({ email, label });
        if (resolvedUserEmail) {
          searchParams.set("userEmail", resolvedUserEmail);
        }
        const response = await fetch(`/api/gmail/messages?${searchParams.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`[Providers] Failed to load ${label} folder: ${errorData.error || `Status ${response.status}`}`);
          return [];
        }
        const data: GmailMessagesResponse = await response.json();
        return data.emails || [];
      });

      const folderResults = await Promise.all(folderFetches);
      const allEmails = folderResults.flat();
      const uniqueEmails = Array.from(
        new Map(allEmails.map((record) => [record.id, record])).values()
      );

      const gmailEmails: Email[] = uniqueEmails.map((record) => ({
        ...record,
        timestamp: new Date(record.date),
        read: false,
        bodyHtml: record.bodyHtml,
        gmailLabel: record.gmailLabel,
        category: record.category,
        summary: record.summary,
        analyzed: record.analyzed || false,
        shouldNotify: record.shouldNotify,
        matchReason: record.matchReason,
        isStarred: record.isStarred,
      }));

      // Sort starred first, then by timestamp descending
      gmailEmails.sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      setSpamEmails(gmailEmails);
      console.log("[Providers] Successfully loaded", gmailEmails.length, "spam/trash emails");
    } catch (error) {
      console.error("[Providers] Error loading spam emails:", error);
    }
  }, [user]);

  const saveConnectedAccount = useCallback((account: ConnectedAccount) => {
    setConnectedAccount((currentAccount) => {
      if (
        currentAccount?.provider === account.provider
        && currentAccount.email === account.email
        && currentAccount.name === account.name
      ) {
        return currentAccount;
      }

      return account;
    });
    setConnectionProvider(account.provider);
    setSessionItem("connectedAccount", JSON.stringify(account));
    setSessionItem("emailConnectionProvider", account.provider);
    
    // Load real emails from Gmail if provider is gmail
    if (account.provider === "gmail") {
      void loadGmailEmails(account.email, user ?? undefined);
      void loadSpamEmails(account.email);
    }
  }, [loadGmailEmails, loadSpamEmails, user]);

  const analyzeEmail = async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email || email.analyzed) return;

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: email.id,
          subject: email.subject,
          preview: email.preview,
          body: email.body,
          userEmail: user,
          scanPreferences: onboardingAnswers
            ? {
                aiExperience: onboardingAnswers.hasUsedAiBefore,
                focusAreas: getFocusAreaPromptSummary(onboardingAnswers.selectedFocusAreas),
                assistantStyle: onboardingAnswers.assistantStyle,
                notificationFrequency: onboardingAnswers.notificationFrequency,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${errorData.error || `Status ${response.status}`}`
        );
      }

      const { category, summary, shouldNotify, matchReason, isStarred } = await response.json();

      const updated = dedupeEmailsById(emails.map((e) =>
        e.id === id
          ? { ...e, category, summary, analyzed: true, shouldNotify, matchReason, isStarred }
          : e
      ));
      setEmails(updated);
      setSessionItem("emails", JSON.stringify(updated));

      const updatedSpam = dedupeEmailsById(spamEmails.map((e) =>
        e.id === id
          ? { ...e, category, summary, analyzed: true, shouldNotify, matchReason, isStarred }
          : e
      ));
      setSpamEmails(updatedSpam);
    } catch (error) {
      console.error("Error analyzing email:", error);
      // Mark as attempted to avoid retry spam
      const updated = dedupeEmailsById(emails.map((e) =>
        e.id === id ? { ...e, analyzed: true } : e
      ));
      setEmails(updated);
      setSessionItem("emails", JSON.stringify(updated));

      const updatedSpam = dedupeEmailsById(spamEmails.map((e) =>
        e.id === id ? { ...e, analyzed: true } : e
      ));
      setSpamEmails(updatedSpam);
    }
  };

  // Aggressive batch analysis - send multiple emails in one request
  const batchAnalyzeEmails = async (emailsToAnalyze: Email[]) => {
    if (emailsToAnalyze.length === 0) return;

    try {
      const payload = emailsToAnalyze.map((e) => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
      }));

      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: payload,
          userEmail: user,
          scanPreferences: onboardingAnswers
            ? {
                aiExperience: onboardingAnswers.hasUsedAiBefore,
                focusAreas: getFocusAreaPromptSummary(onboardingAnswers.selectedFocusAreas),
                assistantStyle: onboardingAnswers.assistantStyle,
                notificationFrequency: onboardingAnswers.notificationFrequency,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${errorData.error || `Status ${response.status}`}`
        );
      }

      const results = await response.json();

      // Update all analyzed emails at once
      const updated = dedupeEmailsById(emails.map((e) => {
        if (results[e.id]) {
          return {
            ...e,
            category: results[e.id].category,
            summary: results[e.id].summary,
            analyzed: true,
            shouldNotify: results[e.id].shouldNotify,
            matchReason: results[e.id].matchReason,
            isStarred: results[e.id].isStarred,
          };
        }
        return e;
      }));

      setEmails(updated);
      setSessionItem("emails", JSON.stringify(updated));

      // Also update spamEmails if any analyzed emails belong there
      const updatedSpam = dedupeEmailsById(spamEmails.map((e) => {
        if (results[e.id]) {
          return {
            ...e,
            category: results[e.id].category,
            summary: results[e.id].summary,
            analyzed: true,
            shouldNotify: results[e.id].shouldNotify,
            matchReason: results[e.id].matchReason,
            isStarred: results[e.id].isStarred,
          };
        }
        return e;
      }));
      setSpamEmails(updatedSpam);
    } catch (error) {
      console.error("Error in batch analysis:", error);
      // Mark all as attempted
      const updated = dedupeEmailsById(emails.map((e) =>
        emailsToAnalyze.some((ta) => ta.id === e.id)
          ? { ...e, analyzed: true }
          : e
      ));
      setEmails(updated);
      setSessionItem("emails", JSON.stringify(updated));
    }
  };

  return (
    <EmailContext.Provider
      value={{
        emails,
        spamEmails,
        isLoggedIn,
        user,
        onboardingAnswers,
        connectionProvider,
        connectedAccount,
        login,
        register,
        logout,
        markAsRead,
        addEmail,
        analyzeEmail,
        batchAnalyzeEmails,
        saveOnboardingAnswers,
        saveConnectionProvider,
        saveConnectedAccount,
        loadGmailEmails,
        loadSpamEmails,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error("useEmail must be used within EmailProvider");
  }
  return context;
}
