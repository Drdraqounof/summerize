"use client";

import { useEmail } from "../providers";
import { useEffect } from "react";

interface EmailDetailProps {
  email: any;
}

const categoryColors: { [key: string]: string } = {
  Work: "bg-blue-50 border-blue-200 text-blue-900",
  Personal: "bg-green-50 border-green-200 text-green-900",
  Promotions: "bg-orange-50 border-orange-200 text-orange-900",
  Alerts: "bg-red-50 border-red-200 text-red-900",
  Other: "bg-gray-50 border-gray-200 text-gray-900",
};

export default function EmailDetail({ email }: EmailDetailProps) {
  const { markAsRead } = useEmail();

  useEffect(() => {
    if (!email.read) {
      markAsRead(email.id);
    }
  }, [email.id, email.read, markAsRead]);

  return (
    <div className="bg-white">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{email.subject}</h2>

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
                <p className="text-sm mb-2">
                  <strong>Category:</strong> {email.category}
                </p>
                {email.summary && (
                  <p className="text-sm">
                    <strong>Summary:</strong> {email.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 prose prose-sm max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{email.body}</p>
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
