"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Inbox, Flag, Clock, Users, TrendingUp, ShieldAlert } from "lucide-react";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";
import AppLayout from "../components/AppLayout";
import type { AnalyticsData, AnalyticsPeriod } from "../api/analytics/route";

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#3b82f6",
  Personal: "#8b5cf6",
  Promotions: "#f59e0b",
  Alerts: "#ef4444",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#9ca3af",
  urgent: "#ef4444",
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900" },
  };
  const s = styles[color];

  return (
    <div className={`rounded-2xl p-5 ${s.bg} border ${s.border} transition hover:shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 tracking-wide">{title}</p>
          <p className={`text-3xl font-bold ${s.text}`}>{value}</p>
        </div>
        {icon && (
          <div className={`${s.bg} p-3 rounded-xl ${s.border} border`}>
            <span className={s.text}>{icon}</span>
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-3">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useEmail();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState<{
    savedUser: string | null;
    savedProvider: string | null;
  }>({ savedUser: null, savedProvider: null });
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");
    const savedProvider = getSessionItem("emailConnectionProvider");
    setSessionSnapshot({ savedUser, savedProvider });
    setHasHydrated(true);
    if (!savedUser) {
      router.replace("/login");
    } else if (!savedProvider) {
      router.replace("/connect");
    }
  }, [router]);

  const userEmail = user || sessionSnapshot.savedUser;

  const fetchAnalytics = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userEmail, period });
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("[AnalyticsPage] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (sessionSnapshot.savedUser && sessionSnapshot.savedProvider) {
      fetchAnalytics();
    }
  }, [period, fetchAnalytics, sessionSnapshot.savedUser, sessionSnapshot.savedProvider]);

  const isLoading = !hasHydrated || !sessionSnapshot.savedUser || !sessionSnapshot.savedProvider;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const categoryPieData = data
    ? Object.entries(data.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const sentimentPieData = data
    ? [
        { name: "Positive", value: data.sentimentBreakdown.positive },
        { name: "Neutral", value: data.sentimentBreakdown.neutral },
        { name: "Urgent", value: data.sentimentBreakdown.urgent },
      ].filter((d) => d.value > 0)
    : [];

  const totalCategories = categoryPieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-2xl shrink-0">{String.fromCodePoint(0x1F4CA)}</div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Analytics</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{user}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Overview</h2>
            <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              {(["week", "month", "all"] as AnalyticsPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    period === p
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {p === "week" ? "Week" : p === "month" ? "Month" : "All Time"}
                </button>
              ))}
            </div>
          </div>

          {loading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl p-5 bg-gray-100 animate-pulse h-32" />
              ))}
            </div>
          ) : data ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Emails"
                  value={data.totalEmails.toLocaleString()}
                  icon={<Inbox size={22} />}
                  color="blue"
                />
                <StatCard
                  title="Flagged"
                  value={data.flaggedEmails.toLocaleString()}
                  subtitle={`${data.totalEmails > 0 ? Math.round((data.flaggedEmails / data.totalEmails) * 100) : 0}% of inbox`}
                  icon={<Flag size={22} />}
                  color="green"
                />
                <StatCard
                  title="Time Saved"
                  value={`${data.estimatedTimeSaved}h`}
                  subtitle="Estimated"
                  icon={<Clock size={22} />}
                  color="amber"
                />
                <StatCard
                  title="Contacts"
                  value={data.totalContacts.toLocaleString()}
                  icon={<Users size={22} />}
                  color="purple"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Category Breakdown</h3>
                  {categoryPieData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie
                            data={categoryPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {categoryPieData.map((entry) => (
                              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#6b7280"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {categoryPieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "#6b7280" }} />
                            <span className="text-sm text-gray-600">{entry.name}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {entry.value} ({totalCategories > 0 ? Math.round((entry.value / totalCategories) * 100) : 0}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No categorized emails yet</p>
                  )}
                </div>

                {/* Sentiment Distribution */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Sentiment Distribution</h3>
                  {sentimentPieData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie
                            data={sentimentPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {sentimentPieData.map((entry) => (
                              <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name.toLowerCase()] || "#6b7280"} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {sentimentPieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[entry.name.toLowerCase()] || "#6b7280" }} />
                            <span className="text-sm text-gray-600">{entry.name}</span>
                            <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No sentiment data yet. Analyze emails first.</p>
                  )}
                </div>
              </div>

              {/* Daily Volume */}
              {data.dailyVolume.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Daily Email Volume</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickFormatter={(val) => val.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Contacts & Health Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Contacts */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Top Contacts</h3>
                  {data.topContacts.length > 0 ? (
                    <div className="space-y-3">
                      {data.topContacts.map((contact, i) => (
                        <div key={contact.senderEmail} className="flex items-center gap-3">
                          <span className="w-6 text-sm font-medium text-gray-400">#{i + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700 shrink-0">
                            {(contact.displayName || contact.senderEmail).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.displayName || contact.senderEmail}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{contact.senderEmail}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{contact.emailCount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No contacts yet</p>
                  )}
                </div>

                {/* Health Stats */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Health Metrics</h3>
                  <div className="space-y-6">
                    {/* Inbox Health Score */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Inbox Health</span>
                        <span className={`text-sm font-bold ${
                          data.inboxHealthScore >= 70 ? "text-green-600" : data.inboxHealthScore >= 40 ? "text-amber-600" : "text-red-600"
                        }`}>{data.inboxHealthScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            data.inboxHealthScore >= 70 ? "bg-green-500" : data.inboxHealthScore >= 40 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${data.inboxHealthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Avg Reply Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Reply Rate</span>
                        <span className="text-sm font-bold text-gray-900">{data.avgReplyRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-purple-500"
                          style={{ width: `${data.avgReplyRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Flag Rate */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Flag Rate</span>
                        <span className="text-sm font-bold text-gray-900">
                          {data.totalEmails > 0 ? Math.round((data.flaggedEmails / data.totalEmails) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-blue-500"
                          style={{ width: `${data.totalEmails > 0 ? (data.flaggedEmails / data.totalEmails) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No data available</p>
              <p className="text-sm mt-1">Sync your emails to see analytics</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
