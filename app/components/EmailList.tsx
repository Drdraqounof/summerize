"use client";

import { type Email, useEmail } from "../providers";
import { useEffect, useRef } from "react";

interface EmailListProps {
  assistantStyle?: string;
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
};

function getInitials(email: string): string {
  const parts = email.split(/[<@]/);
  const name = parts[0]?.trim() || parts[1]?.trim() || "";
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "?";
}

function getAvatarColor(email: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];
  const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function EmailList({
  assistantStyle,
  emails,
  emailsToAnalyze = emails,
  emptyMessage = "No emails yet",
  onSelectEmail,
  selectedId,
}: EmailListProps) {
  const { batchAnalyzeEmails, deleteEmail } = useEmail();
  const batchedRef = useRef(false);
  const showSummaryFirst = assistantStyle === "smart-summaries";

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
          className={`w-full text-left px-3 sm:px-4 py-3 hover:bg-gray-50 transition border-l-4 ${
            selectedId === email.id
              ? "border-green-500 bg-green-50"
              : email.shouldNotify
                ? "border-green-400 bg-white"
                : "border-transparent"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Avatar Circle */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(email.from)}`}
            >
              {getInitials(email.from)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Sender */}
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`text-xs sm:text-sm font-semibold text-gray-900 truncate ${
                    !email.read ? "font-bold" : ""
                  }`}
                >
                  {email.from.split("<")[0]?.trim() || email.from}
                </p>
                {!email.read && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>

              {/* Subject */}
              <p
                className={`text-xs sm:text-sm text-gray-800 mb-1 truncate ${
                  !email.read ? "font-semibold" : "font-normal"
                }`}
              >
                {email.subject}
              </p>

              {/* Preview */}
              <p className="text-xs text-gray-600 truncate mb-2">{email.preview}</p>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {email.shouldNotify && (
                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap bg-green-100 text-green-700 font-medium shrink-0">
                    Watchlist
                  </span>
                )}
                {email.category && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium shrink-0 ${
                      categoryColors[email.category] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {email.category}
                  </span>
                )}
                {email.gmailLabel && (
                  <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap bg-purple-100 text-purple-700 font-medium shrink-0">
                    {email.gmailLabel}
                  </span>
                )}
              </div>
              {email.shouldNotify && email.summary ? (
                <p className="mt-1 text-xs text-blue-700 truncate">Summary: {email.summary}</p>
              ) : null}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(email.timestamp).toLocaleDateString()}
              </p>
            </div>

            <span
              onClick={(e) => { e.stopPropagation(); deleteEmail(email.id); }}
              className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Delete email"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
