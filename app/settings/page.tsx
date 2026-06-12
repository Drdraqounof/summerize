"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";
import RuleManager from "@/app/components/RuleManager";
import NotificationSettings from "@/app/components/NotificationSettings";

type Tab = "rules" | "notifications";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useEmail();
  const [tab, setTab] = useState<Tab>("rules");

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");
    if (!savedUser) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="text-sm text-black hover:text-gray-800 transition font-medium"
            >
              <svg className="w-4 h-4 inline-block -mt-0.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
          <p className="text-black">Manage your email automation preferences</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setTab("rules")}
              className={`px-4 py-2 font-medium transition ${
                tab === "rules"
                  ? "text-black border-b-2 border-emerald-600"
                  : "text-black hover:text-black"
              }`}
            >
              Automation Rules
            </button>
            <button
              onClick={() => setTab("notifications")}
              className={`px-4 py-2 font-medium transition ${
                tab === "notifications"
                  ? "text-black border-b-2 border-emerald-600"
                  : "text-black hover:text-black"
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {tab === "rules" ? (
            <>
              <h2 className="text-lg font-bold mb-4 text-black">Automation Rules</h2>
              <p className="text-sm text-black mb-6">
                Set up rules to automatically categorize, star, and notify on emails that match your criteria.
              </p>
              <RuleManager />
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold mb-4 text-black">Notification Settings</h2>
              <p className="text-sm text-black mb-6">
                Configure how and when you receive email digests of matched watchlist items.
              </p>
              <NotificationSettings />
            </>
          )}
        </div>

        {user && (
          <div className="mt-8 text-center text-sm text-black">
            <p>Logged in as: <strong>{user}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
