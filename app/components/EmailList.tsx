"use client";

import { useEmail } from "../providers";
import { useEffect } from "react";

interface EmailListProps {
  emails: any[];
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
  onSelectEmail,
  selectedId,
}: EmailListProps) {
  const { analyzeEmail } = useEmail();

  // Analyze emails when they load
  useEffect(() => {
    emails.forEach((email) => {
      if (!email.analyzed) {
        analyzeEmail(email.id);
      }
    });
  }, [emails, analyzeEmail]);

  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
        <p className="text-center">No emails yet</p>
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
