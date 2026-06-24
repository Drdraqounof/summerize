"use client";

import { Star, Clock, TrendingUp } from "lucide-react";

interface ContactCardProps {
  metrics: {
    displayName: string;
    email: string;
    importance: number;
    emailCount: number;
    lastEmailAt: string | null;
    avgResponseTime?: number;
    replyRate: number;
    sentimentScore: "positive" | "neutral" | "urgent";
  };
}

function renderSentimentIndicator(sentiment: string) {
  switch (sentiment) {
    case "positive":
      return <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />;
    case "urgent":
      return <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />;
    default:
      return <span className="inline-block w-2 h-2 bg-gray-400 rounded-full" />;
  }
}

function formatDaysAgo(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function renderImportanceStars(importance: number) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= importance ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function ContactCard({ metrics }: ContactCardProps) {
  const responseTimeLabel = metrics.avgResponseTime
    ? metrics.avgResponseTime < 60
      ? `${metrics.avgResponseTime}m`
      : `${Math.round(metrics.avgResponseTime / 60)}h`
    : "Unknown";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-semibold text-gray-900 truncate">{metrics.displayName}</h2>
        <p className="text-xs text-gray-500 truncate">{metrics.email}</p>
      </div>

      {/* Importance Stars */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Importance</span>
        <div className="flex items-center gap-2">
          {renderImportanceStars(metrics.importance)}
          <span className="text-xs text-gray-600">{metrics.importance}/10</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Emails */}
        <div className="p-2 bg-blue-50 rounded">
          <p className="text-xs text-gray-600">Emails</p>
          <p className="text-sm font-semibold text-gray-900">{metrics.emailCount}</p>
        </div>

        {/* Last Contact */}
        <div className="p-2 bg-green-50 rounded">
          <p className="text-xs text-gray-600">Last Contact</p>
          <p className="text-xs font-semibold text-gray-900">{formatDaysAgo(metrics.lastEmailAt)}</p>
        </div>

        {/* Response Time */}
        <div className="p-2 bg-purple-50 rounded">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-purple-600" />
            <p className="text-xs text-gray-600">Response</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{responseTimeLabel}</p>
        </div>

        {/* Reply Rate */}
        <div className="p-2 bg-orange-50 rounded">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-orange-600" />
            <p className="text-xs text-gray-600">Reply Rate</p>
          </div>
          <p className="text-sm font-semibold text-gray-900">{metrics.replyRate}%</p>
        </div>
      </div>

      {/* Sentiment Indicator */}
      <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
        <span className="text-xs text-gray-600">Sentiment</span>
        <div className="flex items-center gap-2">
          {renderSentimentIndicator(metrics.sentimentScore)}
          <span className="text-xs font-medium text-gray-700 capitalize">{metrics.sentimentScore}</span>
        </div>
      </div>

      {/* Pattern Hint */}
      <div className="p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>Pattern:</strong> {metrics.replyRate >= 80 ? "You reply quickly to their emails" : "Occasional replies"}
        </p>
      </div>
    </div>
  );
}
