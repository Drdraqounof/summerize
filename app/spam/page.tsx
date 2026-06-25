"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Email, useEmail } from "../providers";
import EmailList from "../components/EmailList";
import EmailDetail from "../components/EmailDetail";
import { getSessionItem } from "@/lib/client-session";
import AppLayout from "../components/AppLayout";

const mockSpamEmails: Email[] = [
  {
    id: "mock-spam-1",
    from: "winner@lottery-intl.com",
    subject: "YOU WON $5,000,000!!!",
    preview: "Congratulations! You have been selected as the grand prize winner of the International Lottery.",
    body: "CONGRATULATIONS!!!\n\nYou have been selected as the grand prize winner of the International Lottery. You have won $5,000,000 USD.\n\nTo claim your prize, please send your bank details and a processing fee of $250 to the following address...\n\nAct now! This offer expires soon!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    category: "Spam",
  },
  {
    id: "mock-spam-2",
    from: "admin@secure-bank-verify.com",
    subject: "Urgent: Your account has been compromised",
    preview: "We detected suspicious activity on your account. Click here to verify your identity immediately.",
    body: "Dear Customer,\n\nWe have detected unusual activity on your banking account. For your security, your access has been limited.\n\nPlease click the link below to verify your identity and restore full access:\n\n[Verify My Account]\n\nFailure to verify within 24 hours will result in permanent account closure.\n\nSecure Bank Verification Team",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    read: false,
    category: "Spam",
  },
  {
    id: "mock-spam-3",
    from: "deals@cheap-pharma-4u.biz",
    subject: "RE: Your prescription order — 80% OFF",
    preview: "Get the medications you need at unbeatable prices. No prescription required!",
    body: "Hello,\n\nAre you tired of paying high prices for your medications?\n\nWe offer the same FDA-approved drugs at 80% less than your local pharmacy.\n\nNo prescription needed! Discreet shipping right to your door.\n\nOrder now and get FREE shipping!\n\nCheap Pharma 4U",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
    category: "Spam",
  },
  {
    id: "mock-spam-4",
    from: "ceo@urgent-memo.xyz",
    subject: "URGENT BUSINESS PROPOSAL — REPLY NOW",
    preview: "I am looking for a reliable partner to transfer $25M out of my country. Please respond urgently.",
    body: "Dear Friend,\n\nI am Mr. Ibrahim Sani, the Chief Financial Officer of the National Petroleum Corporation of Nigeria.\n\nI am seeking your assistance to transfer $25,000,000 USD out of my country into your account. The funds are currently trapped in a local bank due to bureaucratic restrictions.\n\nIn exchange for your help, I offer you 30% of the total amount.\n\nThis is a completely legal and risk-free transaction. Please reply urgently with your bank details.\n\nBest regards,\nMr. Ibrahim Sani",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    category: "Spam",
  },
  {
    id: "mock-spam-5",
    from: "newsletter@growth-hack-pro.com",
    subject: "Get 10,000 followers in 24 hours!!!",
    preview: "Our proven system delivers real followers, likes, and engagement. Guaranteed or your money back!",
    body: "Tired of struggling to grow your social media?\n\nOur exclusive growth hacking system delivers:\n• 10,000 real followers in 24 hours\n• 5,000+ likes per post\n• Verified accounts only\n• No bots, no fake profiles\n\nUsed by over 50,000 influencers worldwide.\n\nClick here to start your FREE trial today!\n\nGrowth Hack Pro\nUnlock your potential",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
    category: "Spam",
  },
];

export default function SpamPage() {
  const router = useRouter();
  const { user, spamEmails, connectionProvider, connectedAccount, loadSpamEmails, deleteEmail } = useEmail();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState<{ savedProvider: string | null; savedUser: string | null }>({
    savedProvider: null,
    savedUser: null,
  });
  const [localSpam, setLocalSpam] = useState<Email[]>(mockSpamEmails);
  const displayEmails = spamEmails.length > 0 ? spamEmails : localSpam;
  const isLoading = !hasHydrated || !sessionSnapshot.savedUser || !sessionSnapshot.savedProvider;

  useEffect(() => {
    const snapshot = {
      savedProvider: getSessionItem("emailConnectionProvider"),
      savedUser: getSessionItem("emailUser"),
    };
    setSessionSnapshot(snapshot);
    setHasHydrated(true);

    if (!snapshot.savedUser) {
      router.replace("/login");
    } else if (!snapshot.savedProvider) {
      router.replace("/connect");
    }
  }, [router]);

  useEffect(() => {
    if (hasHydrated && user && connectedAccount?.email && connectionProvider === "gmail") {
      loadSpamEmails(connectedAccount.email);
    }
  }, [hasHydrated, user, connectedAccount?.email, connectionProvider, loadSpamEmails]);

  useEffect(() => {
    if (selectedEmailId && !displayEmails.some((email) => email.id === selectedEmailId)) {
      setSelectedEmailId(displayEmails[0]?.id ?? null);
    }
  }, [selectedEmailId, displayEmails]);

  const handleDelete = (id: string) => {
    if (spamEmails.length > 0) {
      deleteEmail(id);
    } else {
      setLocalSpam((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmailId === id) setSelectedEmailId(null);
    }
  };

  const selectedEmail: Email | undefined = displayEmails.find((e) => e.id === selectedEmailId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-2xl shrink-0">🗑️</div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Spam & Trash</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{user}</p>
              {connectedAccount?.email ? (
                <p className="text-xs text-gray-500">{connectedAccount.email}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full md:w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] bg-white border-r border-gray-200 overflow-y-auto ${
            selectedEmailId && "hidden md:flex md:flex-col"
          }`}
        >
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Spam & Trash</h2>
            <p className="text-sm text-gray-600">
              {displayEmails.length} emails
            </p>
          </div>
          <EmailList
            emails={displayEmails}
            emailsToAnalyze={displayEmails}
            emptyMessage="No spam or trash emails"
            onSelectEmail={setSelectedEmailId}
            selectedId={selectedEmailId}
            onDeleteEmail={handleDelete}
          />
        </div>

        {selectedEmail ? (
          <div className={`flex-1 overflow-y-auto ${!selectedEmailId && "hidden md:flex md:flex-col"}`}>
            <div className="md:hidden p-4 bg-white border-b border-gray-200">
              <button
                onClick={() => setSelectedEmailId(null)}
                className="text-blue-600 font-medium"
              >
                ← Back to Spam
              </button>
            </div>
            <EmailDetail email={selectedEmail} onDelete={handleDelete} />
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
