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
  threadId?: string;
}

interface ConnectedAccount {
  provider: string;
  email: string;
  name?: string;
}

interface GmailApiEmail {
  id: string;
  threadId?: string;
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
  isHydrated: boolean;
  isLoggedIn: boolean;
  user: string | null;
  onboardingAnswers: OnboardingAnswers | null;
  connectionProvider: string | null;
  connectedAccount: ConnectedAccount | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name?: string) => Promise<AuthResult>;
  logout: () => void;
  markAsRead: (id: string) => void;
  deleteEmail: (id: string) => void;
  addEmail: (email: Email) => void;
  analyzeEmail: (id: string) => Promise<void>;
  batchAnalyzeEmails: (emails: Email[]) => Promise<void>;
  saveOnboardingAnswers: (answers: OnboardingAnswers) => Promise<void>;
  saveConnectionProvider: (provider: string) => void;
  saveConnectedAccount: (account: ConnectedAccount) => void;
  hydrateSignedInUser: (email: string, answers: OnboardingAnswers | null) => void;
  loadGmailEmails: (email: string) => Promise<void>;
  loadSpamEmails: (email: string) => Promise<void>;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const sampleEmails: Email[] = [
  {
    id: "sample-1",
    from: "alex.chen@acmecorp.com",
    subject: "Q3 Budget Review — feedback needed",
    preview: "Hey, I've attached the draft budget for Q3. Please take a look and share your feedback before Friday.",
    body: "Hey,\n\nI've attached the draft budget for Q3. Please take a look and share your feedback before Friday.\n\nThe marketing team has requested an additional $15k for the campaign push in August. Let me know if that works within our targets.\n\nBest,\nAlex Chen\nAcme Corp Finance",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    category: "Work",
    isStarred: true,
  },
  {
    id: "sample-2",
    from: "stripe@notify.com",
    subject: "Your invoice for May 2026 is ready",
    preview: "Your Stripe invoice for May 2026 is now available. Total amount: $299.00.",
    body: "Hi there,\n\nYour Stripe invoice for May 2026 is now available.\n\nAmount: $299.00\nDue date: June 15, 2026\n\nView your invoice at: https://dashboard.stripe.com/invoices\n\nThanks,\nStripe Billing",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    category: "Finance",
    isStarred: true,
  },
  {
    id: "sample-3",
    from: "sarah.miller@startup.io",
    subject: "Updated wireframes for the dashboard",
    preview: "We've made some changes based on your feedback. The new navigation layout is much cleaner.",
    body: "Hey,\n\nWe've made some changes based on your feedback. The new navigation layout is much cleaner.\n\nKey changes:\n- Moved the analytics tab to the top nav\n- Added quick action buttons in the sidebar\n- Reduced clutter in the main view\n\nLet me know what you think!\n\nSarah Miller\nDesign Lead, Startup.io",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: false,
    category: "Work",
    isStarred: false,
  },
  {
    id: "sample-4",
    from: "github@noreply.com",
    subject: "[summerize] PR #127: Fix email sync timeout",
    preview: "Hey, can you review this PR when you get a chance? It addresses the timeout issue in the Gmail sync.",
    body: "Hey,\n\nCan you review this PR when you get a chance?\n\nIt addresses the timeout issue in the Gmail sync worker. The root cause was an unhandled promise rejection when the Gmail API takes longer than 30s to respond.\n\nChanges:\n- Added configurable timeout parameter\n- Added retry logic with exponential backoff\n- Improved error logging\n\nCheers,\nDavid",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    category: "Dev",
    isStarred: true,
  },
  {
    id: "sample-5",
    from: "notifications@linkedin.com",
    subject: "You have 3 new connection requests",
    preview: "Connect with Priya Patel, James Wilson, and 1 other person who viewed your profile.",
    body: "Hi,\n\nYou have 3 new connection requests:\n\n1. Priya Patel — Product Manager at Finance Group\n2. James Wilson — Software Engineer at TechCorp\n3. Morgan Lee — Recruiter at TalentHub\n\nView your pending invitations at LinkedIn.\n\n— LinkedIn",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
    category: "Updates",
    isStarred: false,
  },
];

const sampleSpamEmails: Email[] = [
  {
    id: "sspam-1",
    from: "winner@lottery-intl.com",
    subject: "YOU WON $5,000,000!!!",
    preview: "Congratulations! You have been selected as the grand prize winner of the International Lottery.",
    body: "CONGRATULATIONS!!!\n\nYou have been selected as the grand prize winner of the International Lottery. You have won $5,000,000 USD.\n\nTo claim your prize, please send your bank details and a processing fee of $250 to the following address...\n\nAct now! This offer expires soon!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    category: "Spam",
  },
  {
    id: "sspam-2",
    from: "admin@secure-bank-verify.com",
    subject: "Urgent: Your account has been compromised",
    preview: "We detected suspicious activity on your account. Click here to verify your identity immediately.",
    body: "Dear Customer,\n\nWe have detected unusual activity on your banking account. For your security, your access has been limited.\n\nPlease click the link below to verify your identity and restore full access:\n\n[Verify My Account]\n\nFailure to verify within 24 hours will result in permanent account closure.\n\nSecure Bank Verification Team",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    read: false,
    category: "Spam",
  },
  {
    id: "sspam-3",
    from: "deals@cheap-pharma-4u.biz",
    subject: "RE: Your prescription order — 80% OFF",
    preview: "Get the medications you need at unbeatable prices. No prescription required!",
    body: "Hello,\n\nAre you tired of paying high prices for your medications?\n\nWe offer the same FDA-approved drugs at 80% less than your local pharmacy.\n\nNo prescription needed! Discreet shipping right to your door.\n\nOrder now and get FREE shipping!\n\nCheap Pharma 4U",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
    category: "Spam",
  },
  {
    id: "sspam-4",
    from: "ceo@urgent-memo.xyz",
    subject: "URGENT BUSINESS PROPOSAL — REPLY NOW",
    preview: "I am looking for a reliable partner to transfer $25M out of my country. Please respond urgently.",
    body: "Dear Friend,\n\nI am Mr. Ibrahim Sani, the Chief Financial Officer of the National Petroleum Corporation of Nigeria.\n\nI am seeking your assistance to transfer $25,000,000 USD out of my country into your account. The funds are currently trapped in a local bank due to bureaucratic restrictions.\n\nIn exchange for your help, I offer you 30% of the total amount.\n\nThis is a completely legal and risk-free transaction. Please reply urgently with your bank details.\n\nBest regards,\nMr. Ibrahim Sani",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    category: "Spam",
  },
  {
    id: "sspam-5",
    from: "newsletter@growth-hack-pro.com",
    subject: "Get 10,000 followers in 24 hours!!!",
    preview: "Our proven system delivers real followers, likes, and engagement. Guaranteed or your money back!",
    body: "Tired of struggling to grow your social media?\n\nOur exclusive growth hacking system delivers:\n• 10,000 real followers in 24 hours\n• 5,000+ likes per post\n• Verified accounts only\n• No bots, no fake profiles\n\nUsed by over 50,000 influencers worldwide.\n\nClick here to start your FREE trial today!\n\nGrowth Hack Pro\nUnlock your potential",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
    category: "Spam",
  },
];

function dedupeEmailsById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [spamEmails, setSpamEmails] = useState<Email[]>(sampleSpamEmails);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);
  const [connectionProvider, setConnectionProvider] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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

    const savedSpam = getSessionItem("spamEmails");
    if (savedSpam) {
      setSpamEmails(dedupeEmailsById(JSON.parse(savedSpam) as Email[]));
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

    setIsHydrated(true);
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
    removeSessionItem("spamEmails");
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

  const deleteEmail = (id: string) => {
    const updated = emails.filter((e) => e.id !== id);
    setEmails(updated);
    setSessionItem("emails", JSON.stringify(updated));

    const updatedSpam = spamEmails.filter((e) => e.id !== id);
    setSpamEmails(updatedSpam);
    setSessionItem("spamEmails", JSON.stringify(updatedSpam));
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
        threadId: emailRecord.threadId,
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
        threadId: record.threadId,
      }));

      // Sort starred first, then by timestamp descending
      gmailEmails.sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      setSpamEmails(gmailEmails);
      setSessionItem("spamEmails", JSON.stringify(gmailEmails));
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
        isHydrated,
        isLoggedIn,
        user,
        onboardingAnswers,
        connectionProvider,
        connectedAccount,
        login,
        register,
        logout,
        markAsRead,
        deleteEmail,
        addEmail,
        analyzeEmail,
        batchAnalyzeEmails,
        saveOnboardingAnswers,
        saveConnectionProvider,
        saveConnectedAccount,
        hydrateSignedInUser,
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
