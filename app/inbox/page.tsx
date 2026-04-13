"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";
import EmailList from "../components/EmailList";
import EmailDetail from "../components/EmailDetail";

export default function InboxPage() {
  const router = useRouter();
  const { user, logout, emails, connectionProvider, connectedAccount } = useEmail();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("📄 PAGE: Inbox page loaded");
  console.log("📄 user from context:", user);
  console.log("📄 emails:", emails);

  // Check authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("emailUser");
    const savedProvider = localStorage.getItem("emailConnectionProvider");
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
      setIsLoading(false);
    }
  }, [router]);

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

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📧</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Checker</h1>
              <p className="text-sm text-gray-600">{user}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Connected: {connectionProvider ?? "Not selected"}
              </p>
              {connectedAccount?.email ? (
                <p className="text-xs text-gray-500">{connectedAccount.email}</p>
              ) : null}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div
          className={`w-full md:w-96 bg-white border-r border-gray-200 overflow-y-auto ${
            selectedEmailId && "hidden md:flex md:flex-col"
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Inbox</h2>
            <p className="text-sm text-gray-600">{emails.length} emails</p>
          </div>
          <EmailList
            emails={emails}
            onSelectEmail={setSelectedEmailId}
            selectedId={selectedEmailId}
          />
        </div>

        {/* Email Detail */}
        {selectedEmail ? (
          <div className={`flex-1 overflow-y-auto ${!selectedEmailId && "hidden md:flex md:flex-col"}`}>
            <div className="md:hidden p-4 bg-white border-b border-gray-200">
              <button
                onClick={() => setSelectedEmailId(null)}
                className="text-blue-600 font-medium"
              >
                ← Back to Inbox
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
