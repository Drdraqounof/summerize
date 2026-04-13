"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  read: boolean;
  category?: string;
  summary?: string;
  analyzed?: boolean;
}

interface OnboardingAnswers {
  reason: string;
  hasUsedSimilarApps: string;
}

interface ConnectedAccount {
  provider: string;
  email: string;
  name?: string;
}

interface EmailContextType {
  emails: Email[];
  isLoggedIn: boolean;
  user: string | null;
  onboardingAnswers: OnboardingAnswers | null;
  connectionProvider: string | null;
  connectedAccount: ConnectedAccount | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  markAsRead: (id: string) => void;
  addEmail: (email: Email) => void;
  analyzeEmail: (id: string) => Promise<void>;
  saveOnboardingAnswers: (answers: OnboardingAnswers) => void;
  saveConnectionProvider: (provider: string) => void;
  saveConnectedAccount: (account: ConnectedAccount) => void;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);
  const [connectionProvider, setConnectionProvider] = useState<string | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);

  useEffect(() => {
    // Only run on client after hydration
    // Load from localStorage
    const savedUser = localStorage.getItem("emailUser");
    const savedEmails = localStorage.getItem("emails");
    const savedAnswers = localStorage.getItem("onboardingAnswers");
    const savedProvider = localStorage.getItem("emailConnectionProvider");
    const savedConnectedAccount = localStorage.getItem("connectedAccount");

    if (savedUser) {
      setUser(savedUser);
      setIsLoggedIn(true);
    }

    if (savedEmails) {
      setEmails(JSON.parse(savedEmails));
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

  const login = (email: string, password: string) => {
    // Simple validation - in production use real auth
    if (email && password.length >= 6) {
      setUser(email);
      setIsLoggedIn(true);
      localStorage.setItem("emailUser", email);

      // Load sample emails
      const sampleEmails: Email[] = [
        {
          id: "1",
          from: "noreply@example.com",
          subject: "Welcome to Email Checker!",
          preview: "Thanks for signing up to our PWA...",
          body: "Welcome to Email Checker PWA! This is your first email.",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          read: false,
        },
        {
          id: "2",
          from: "notifications@example.com",
          subject: "New notification",
          preview: "You have a new notification from...",
          body: "This is a test notification email.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
        },
      ];

      setEmails(sampleEmails);
      localStorage.setItem("emails", JSON.stringify(sampleEmails));
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setEmails([]);
    setOnboardingAnswers(null);
    setConnectionProvider(null);
    setConnectedAccount(null);
    localStorage.removeItem("emailUser");
    localStorage.removeItem("emails");
    localStorage.removeItem("onboardingAnswers");
    localStorage.removeItem("emailConnectionProvider");
    localStorage.removeItem("connectedAccount");
  };

  const markAsRead = (id: string) => {
    const updated = emails.map((e) =>
      e.id === id ? { ...e, read: true } : e
    );
    setEmails(updated);
    localStorage.setItem("emails", JSON.stringify(updated));
  };

  const addEmail = (email: Email) => {
    const updated = [email, ...emails];
    setEmails(updated);
    localStorage.setItem("emails", JSON.stringify(updated));
  };

  const saveOnboardingAnswers = (answers: OnboardingAnswers) => {
    setOnboardingAnswers(answers);
    localStorage.setItem("onboardingAnswers", JSON.stringify(answers));
  };

  const saveConnectionProvider = (provider: string) => {
    setConnectionProvider(provider);
    localStorage.setItem("emailConnectionProvider", provider);
  };

  const saveConnectedAccount = (account: ConnectedAccount) => {
    setConnectedAccount(account);
    setConnectionProvider(account.provider);
    localStorage.setItem("connectedAccount", JSON.stringify(account));
    localStorage.setItem("emailConnectionProvider", account.provider);
  };

  const analyzeEmail = async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email || email.analyzed) return;

    try {
      const response = await fetch("/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: email.subject,
          preview: email.preview,
          body: email.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${errorData.error || `Status ${response.status}`}`
        );
      }

      const { category, summary } = await response.json();

      const updated = emails.map((e) =>
        e.id === id
          ? { ...e, category, summary, analyzed: true }
          : e
      );
      setEmails(updated);
      localStorage.setItem("emails", JSON.stringify(updated));
    } catch (error) {
      console.error("Error analyzing email:", error);
      // Mark as attempted to avoid retry spam
      const updated = emails.map((e) =>
        e.id === id ? { ...e, analyzed: true } : e
      );
      setEmails(updated);
      localStorage.setItem("emails", JSON.stringify(updated));
    }
  };

  return (
    <EmailContext.Provider
      value={{
        emails,
        isLoggedIn,
        user,
        onboardingAnswers,
        connectionProvider,
        connectedAccount,
        login,
        logout,
        markAsRead,
        addEmail,
        analyzeEmail,
        saveOnboardingAnswers,
        saveConnectionProvider,
        saveConnectedAccount,
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
