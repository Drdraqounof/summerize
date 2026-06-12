"use client";

import { useEffect, useState } from "react";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";

interface NotificationSettingsData {
  notificationEnabled: boolean;
  notificationFrequency: string | null;
  lastDigestSentAt: string | null;
}

const FREQUENCIES = [
  { value: "hourly", label: "Hourly", description: "Multiple digests throughout the day" },
  { value: "daily", label: "Daily", description: "One digest per day" },
  { value: "weekly", label: "Weekly", description: "A weekly summary" },
];

export default function NotificationSettings() {
  const { user } = useEmail();
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsData | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentUser = user ?? (hydrated ? getSessionItem("emailUser") : null);

  useEffect(() => {
    if (!currentUser) return;
    fetchSettings();
  }, [currentUser]);

  const fetchSettings = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(currentUser)}`);
      if (res.ok) {
        const data: NotificationSettingsData = await res.json();
        setSettings(data);
        setEnabled(data.notificationEnabled);
        setFrequency(data.notificationFrequency || "daily");
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser,
          notificationEnabled: enabled,
          notificationFrequency: enabled ? frequency : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const updated: NotificationSettingsData = await res.json();
      setSettings(updated);
      setMessage({ type: "success", text: "Notification settings saved." });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestDigest = async () => {
    if (!currentUser) return;
    setSendingDigest(true);
    setMessage(null);
    try {
      const res = await fetch("/api/notifications/send-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser }),
      });
      const data = await res.json();
      if (data.sent) {
        setMessage({ type: "success", text: `Test digest sent! ${data.itemCount} email(s) included.` });
      } else {
        setMessage({ type: "error", text: data.message || "No emails to send." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to send digest" });
    } finally {
      setSendingDigest(false);
    }
  };

  if (!currentUser) {
    return <div className="p-4 text-center text-black">Sign in to manage notifications.</div>;
  }

  if (loading) {
    return <div className="p-4 text-center">Loading notification settings...</div>;
  }

  const lastDigestDate = settings?.lastDigestSentAt
    ? new Date(settings.lastDigestSentAt).toLocaleString()
    : "Never";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="font-medium text-sm text-black">Email Notifications</p>
          <p className="text-xs text-black mt-0.5">Receive email digests with matched watchlist items</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition" />
        </label>
      </div>

      {enabled && (
        <div>
          <p className="font-medium text-sm mb-3 text-black">Digest Frequency</p>
          <div className="grid gap-3">
            {FREQUENCIES.map((opt) => (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  frequency === opt.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    checked={frequency === opt.value}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-4 h-4 text-emerald-600"
                  />
                  <div>
                    <p className="font-medium text-sm text-black">{opt.label}</p>
                    <p className="text-xs text-black">{opt.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-black">
        Last digest sent: <span className="font-medium">{lastDigestDate}</span>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-sm ${
          message.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button
          onClick={handleSendTestDigest}
          disabled={sendingDigest || !enabled}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-black hover:bg-gray-50 transition disabled:opacity-50"
        >
          {sendingDigest ? "Sending..." : "Send Test Digest"}
        </button>
      </div>
    </div>
  );
}
