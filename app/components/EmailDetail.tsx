"use client";

import { type Email, useEmail } from "../providers";
import { useEffect } from "react";

interface EmailDetailProps {
  assistantStyle?: string;
  email: Email;
}

const categoryColors: { [key: string]: string } = {
  Work: "bg-blue-50 border-blue-200 text-blue-900",
  Personal: "bg-green-50 border-green-200 text-green-900",
  Promotions: "bg-orange-50 border-orange-200 text-orange-900",
  Alerts: "bg-red-50 border-red-200 text-red-900",
  Other: "bg-gray-50 border-gray-200 text-gray-900",
};

export default function EmailDetail({ assistantStyle, email }: EmailDetailProps) {
  const { markAsRead } = useEmail();
  const showSummaryFirst = assistantStyle === "smart-summaries";
  const showActionReasonFirst = assistantStyle === "action-items";

  useEffect(() => {
    if (!email.read) {
      markAsRead(email.id);
    }
  }, [email.id, email.read, markAsRead]);

  return (
    <div className="bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{email.subject}</h2>

        {email.shouldNotify ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Flagged for your watchlist</p>
            <p className="mt-1">
              {showActionReasonFirst
                ? email.matchReason || "This email matches one of your chosen topics."
                : email.matchReason || "This email matches one of your chosen topics."}
            </p>
          </div>
        ) : null}

        <div className="space-y-2 mb-6">
          <div>
            <p className="text-sm text-gray-600">From</p>
            <p className="font-semibold text-gray-900">{email.from}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-gray-900">
              {new Date(email.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* AI Analysis Card */}
        {email.category && (
          <div
            className={`p-4 rounded-lg border-2 ${
              categoryColors[email.category] || categoryColors.Other
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">✨</span>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">AI Analysis</p>
                {showSummaryFirst && email.summary ? (
                  <p className="text-sm mb-2">
                    <strong>Summary:</strong> {email.summary}
                  </p>
                ) : null}
                <p className="text-sm mb-2">
                  <strong>Category:</strong> {email.category}
                </p>
                {!showSummaryFirst && email.summary && (
                  <p className="text-sm">
                    <strong>Summary:</strong> {email.summary}
                  </p>
                )}
                {showActionReasonFirst && email.matchReason ? (
                  <p className="mt-2 text-sm">
                    <strong>Why it matters:</strong> {email.matchReason}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 max-w-none text-gray-700 [&_a]:text-blue-600 [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_table]:w-full [&_td]:align-top [&_th]:align-top">
        {email.bodyHtml ? (
          <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
        ) : (
          <p className="whitespace-pre-wrap">{email.body}</p>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 space-y-2">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
          Reply
        </button>
        <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition">
          Delete
        </button>
      </div>
    </div>
  );
}
