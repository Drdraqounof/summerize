"use client";

import { type Email, useEmail } from "../providers";
import { useEffect, useRef } from "react";

interface EmailListProps {
  emails: Email[];
  emailsToAnalyze?: Email[];
  emptyMessage?: string;
  onSelectEmail: (id: string) => void;
  selectedId: string | null;
}

const categoryColors: { [key: string]: string } = {
  Work: "bg-blue-100 text-blue-700",
  Personal: "bg-green-100 text-green-700",
  Promotions: "bg-orange-100 text-orange-700",
  Alerts: "bg-red-100 text-red-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function EmailList({
  emails,
  emailsToAnalyze = emails,
  emptyMessage = "No emails yet",
  onSelectEmail,
  selectedId,
}: EmailListProps) {
  const { batchAnalyzeEmails } = useEmail();
  const batchedRef = useRef(false);

  // Batch analyze all unanalyzed emails in one request
  useEffect(() => {
    if (batchedRef.current || emailsToAnalyze.length === 0) return;

    const unanalyzedEmails = emailsToAnalyze.filter((e) => !e.analyzed);
    if (unanalyzedEmails.length === 0) {
      batchedRef.current = true;
      return;
    }

    batchedRef.current = true;
    batchAnalyzeEmails(unanalyzedEmails).catch((error) => {
      console.error("Batch analysis failed:", error);
    });
  }, [batchAnalyzeEmails, emailsToAnalyze]);

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
        <p className="text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelectEmail(email.id)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-l-4 ${
            selectedId === email.id
              ? "border-blue-600 bg-blue-50"
              : "border-transparent"
          } ${!email.read ? "font-semibold" : "font-normal"}`}
        >
          <div className="flex items-start gap-2">
            <span className={`text-lg ${email.read ? "opacity-50" : ""}`}>
              {email.read ? "📖" : "📬"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {email.from}
                </p>
                {email.shouldNotify ? (
                  <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-700">
                    Notify
                  </span>
                ) : null}
                {email.category ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      categoryColors[email.category] || categoryColors.Other
                    }`}
                  >
                    {email.category}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">analyzing...</span>
                )}
              </div>
              <p className="text-sm text-gray-700 truncate">{email.subject}</p>
              <p className="text-xs text-gray-500 truncate">{email.preview}</p>
              {email.shouldNotify && email.matchReason ? (
                <p className="text-xs text-emerald-700 truncate mt-1">{email.matchReason}</p>
              ) : null}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(email.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
