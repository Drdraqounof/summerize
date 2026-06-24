"use client";

import { useEffect, useState } from "react";
import { Mail, Calendar, CheckSquare, Users } from "lucide-react";
import ContactCard from "./ContactCard";

interface ConversationSidebarProps {
  threadId?: string;
  userEmail?: string;
}

interface EmailInThread {
  id: string;
  from: string;
  subject: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
}

interface ActionItem {
  task: string;
  deadline?: string;
  fromEmail: string;
}

interface ConversationData {
  threadId: string;
  emailCount: number;
  emails: EmailInThread[];
  contactMetrics: any;
  actionItems: ActionItem[];
  importantDates: string[];
  participants: string[];
}

export default function ConversationSidebar({ threadId, userEmail }: ConversationSidebarProps) {
  const [data, setData] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId || !userEmail) {
      setLoading(false);
      return;
    }

    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/conversations/${encodeURIComponent(threadId)}?userEmail=${encodeURIComponent(userEmail)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch conversation: ${response.statusText}`);
        }

        const conversationData = await response.json();
        setData(conversationData);
        setError(null);
      } catch (err) {
        console.error("[ConversationSidebar] Error fetching conversation:", err);
        setError(err instanceof Error ? err.message : "Failed to load conversation");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [threadId, userEmail]);

  if (!threadId) {
    return (
      <div className="hidden lg:block w-96 border-l border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">No conversation data available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="hidden lg:block w-96 border-l border-gray-200 bg-gray-50 p-4">
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="hidden lg:block w-96 border-l border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-red-500">{error || "Failed to load conversation"}</p>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto">
      {/* Contact Card */}
      {data.contactMetrics && (
        <div className="border-b border-gray-200 p-4">
          <ContactCard metrics={data.contactMetrics} />
        </div>
      )}

      {/* Thread History */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <Mail size={16} />
          Thread History ({data.emailCount})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.emails.slice(0, 5).map((email) => (
            <div
              key={email.id}
              className="p-2 bg-white rounded border border-gray-200 hover:border-gray-300 cursor-pointer transition"
              onClick={() => setExpandedEmail(expandedEmail === email.id ? null : email.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{email.from.split("@")[0]}</p>
                  <p className="text-xs text-gray-600 truncate">{email.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(email.receivedAt).toLocaleDateString()}
                  </p>
                </div>
                {!email.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
              </div>
              {expandedEmail === email.id && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-700">{email.preview}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      {data.actionItems.length > 0 && (
        <div className="border-b border-gray-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <CheckSquare size={16} />
            Action Items
          </h3>
          <div className="space-y-2">
            {data.actionItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 p-2 bg-white rounded border border-gray-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 flex-shrink-0"
                  defaultChecked={false}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-900">{item.task}</p>
                  {item.deadline && <p className="text-xs text-red-600 font-medium">{item.deadline}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Dates */}
      {data.importantDates.length > 0 && (
        <div className="border-b border-gray-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Calendar size={16} />
            Key Dates
          </h3>
          <div className="space-y-1">
            {data.importantDates.map((date, idx) => (
              <div key={idx} className="text-xs text-gray-700 p-2 bg-white rounded border border-gray-200">
                • {date}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Contacts */}
      {data.participants.length > 0 && (
        <div className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Users size={16} />
            Other Participants
          </h3>
          <div className="space-y-1">
            {data.participants.map((participant) => (
              <div key={participant} className="text-xs text-gray-700 p-2 bg-white rounded border border-gray-200">
                {participant}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
