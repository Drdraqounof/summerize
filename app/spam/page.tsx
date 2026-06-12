"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Email, useEmail } from "../providers";
import EmailList from "../components/EmailList";
import EmailDetail from "../components/EmailDetail";
import { getSessionItem } from "@/lib/client-session";

export default function SpamPage() {
  const router = useRouter();
  const { user, spamEmails, connectionProvider, connectedAccount, loadSpamEmails, logout } = useEmail();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState<{ savedProvider: string | null; savedUser: string | null }>({
    savedProvider: null,
    savedUser: null,
  });
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
    if (selectedEmailId && !spamEmails.some((email) => email.id === selectedEmailId)) {
      setSelectedEmailId(spamEmails[0]?.id ?? null);
    }
  }, [selectedEmailId, spamEmails]);

  const selectedEmail: Email | undefined = spamEmails.find((e) => e.id === selectedEmailId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/inbox")}
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition whitespace-nowrap"
            >
              Back to Inbox
            </button>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-4 py-2 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
            >
              Logout
            </button>
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
              {spamEmails.length} emails
            </p>
          </div>
          <EmailList
            emails={spamEmails}
            emailsToAnalyze={spamEmails}
            emptyMessage="No spam or trash emails"
            onSelectEmail={setSelectedEmailId}
            selectedId={selectedEmailId}
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
            <EmailDetail email={selectedEmail} />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select an email to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
