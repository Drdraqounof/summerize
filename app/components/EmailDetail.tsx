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
};

export default function EmailDetail({ assistantStyle, email }: EmailDetailProps) {
  const { markAsRead, deleteEmail } = useEmail();
  const showSummaryFirst = assistantStyle === "smart-summaries";
  const showActionReasonFirst = assistantStyle === "action-items";

  useEffect(() => {
    if (!email.read) {
      markAsRead(email.id);
    }
  }, [email.id, email.read, markAsRead]);

  return (
    <div className="bg-white overflow-y-auto">
      {/* Detail Pane Header - NEW STRUCTURE */}
      <div className="border-b border-gray-200 sticky top-0 bg-white">
        {/* Subject */}
        <div className="px-4 sm:px-6 pt-6 pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
            {email.subject}
          </h2>
        </div>

        {/* Metadata: From + Date in tight row */}
        <div className="px-4 sm:px-6 pb-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide">From</p>
              <p className="text-sm font-semibold text-gray-900">{email.from}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Date</p>
              <p className="text-sm text-gray-900">
                {new Date(email.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Icon + short word */}
        <div className="px-4 sm:px-6 pb-4 flex items-center gap-2 border-t border-gray-100 pt-3">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-2m4 2l4-2"
              />
            </svg>
            Archive
          </button>
          <button onClick={() => deleteEmail(email.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 transition text-red-700 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-yellow-50 transition text-yellow-700 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Flag
          </button>
        </div>
      </div>

      {/* AI Summary Card - Positioned ABOVE body */}
      {email.category && (
        <div className="px-4 sm:px-6 pt-4 pb-0">
          <div
            className={`p-4 rounded-lg border-2 ${
              categoryColors[email.category] || "bg-gray-50 border-gray-200 text-gray-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">✨</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm mb-2 text-gray-900">AI Summary</p>
                {showSummaryFirst && email.summary ? (
                  <p className="text-sm mb-2 text-gray-800">
                    {email.summary}
                  </p>
                ) : null}
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  Category: <span className="font-normal">{email.category}</span>
                </p>
                {!showSummaryFirst && email.summary && (
                  <p className="text-sm text-gray-800 mb-1">
                    {email.summary}
                  </p>
                )}
                {showActionReasonFirst && email.matchReason ? (
                  <p className="mt-2 text-sm text-gray-800">
                    <span className="font-semibold">Why:</span> {email.matchReason}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Body */}
      <div className="p-4 sm:p-6 max-w-none text-sm sm:text-base text-gray-700 [&_a]:text-blue-600 [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_table]:w-full [&_table]:text-xs sm:[&_table]:text-sm [&_td]:align-top [&_th]:align-top [&_td]:p-2 sm:[&_td]:p-3 [&_th]:p-2 sm:[&_th]:p-3">
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
        <button onClick={() => deleteEmail(email.id)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition">
          Delete
        </button>
      </div>
    </div>
  );
}
