"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useEmail } from "../providers";
import AppLayout from "../components/AppLayout";
import { getSessionItem } from "@/lib/client-session";
import type { DashboardStats } from "@/lib/dashboard-stats";

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#3b82f6",
  Personal: "#8b5cf6",
  Promotions: "#f59e0b",
  Alerts: "#ef4444",
};

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: "up" | "down"; percent: number } | null;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red";
}) {
  const styles = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", icon: "text-blue-600" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", icon: "text-green-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "text-amber-600" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-900", icon: "text-red-600" },
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
            <span className={s.icon}>{icon}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-3">
        {trend && trend.percent !== 0 && (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-semibold ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend.direction === "up" ? "\u2191" : "\u2193"} {Math.abs(trend.percent)}%
            </span>
          </div>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useEmail();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");
    if (!savedUser) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const syncAndFetchStats = async () => {
      setLoading(true);
      setSyncing(true);
      setError(null);
      try {
        // Sync Gmail emails first
        const syncRes = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail: user }),
        });
        if (!syncRes.ok) {
          const syncData = await syncRes.json().catch(() => ({}));
          console.warn("[Dashboard] Sync warning:", syncData.error || syncRes.status);
        }
        setSyncing(false);

        // Then fetch stats from the database
        const res = await fetch(`/api/dashboard/stats?userEmail=${encodeURIComponent(user)}&period=all`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error (${res.status})`);
        }
        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSyncing(false);
        setLoading(false);
      }
    };

    syncAndFetchStats();
  }, [user]);

  const pieData = stats
    ? Object.entries(stats.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const totalCategories = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">{String.fromCodePoint(0x1F4CA)}</span>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700">
                  {user.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline truncate max-w-[200px]">{user}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your email activity at a glance</p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{syncing ? "Syncing your Gmail..." : "Loading your stats..."}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">Could not load dashboard</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 transition"
              >
                Try again
              </button>
            </div>
          )}

          {stats && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Emails Processed"
                  value={stats.emailsProcessed}
                  trend={stats.trend}
                  subtitle={stats.emailsProcessed > 0 ? "All time" : ""}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  color="blue"
                />
                <StatCard
                  title="Flagged"
                  value={stats.starredEmails}
                  subtitle={stats.emailsProcessed > 0 ? `${Math.round((stats.starredEmails / stats.emailsProcessed) * 100)}% of inbox` : ""}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  }
                  color="green"
                />
                <StatCard
                  title="Time Saved"
                  value={`${stats.estimatedTimeSaved}h`}
                  subtitle="In estimated reading"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="amber"
                />
                <StatCard
                  title="Rules Active"
                  value={stats.rulesActive}
                  subtitle={stats.topRule ? stats.topRule.name : "No rules set up"}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                  color="red"
                />
                <StatCard
                  title="AI Cost"
                  value={stats.costThisPeriod === 0 ? "$0" : `$${stats.costThisPeriod.toFixed(4)}`}
                  subtitle={stats.emailsProcessed > 0 ? (stats.costThisPeriod === 0 ? "$0/email" : `$${(stats.costThisPeriod / stats.emailsProcessed).toFixed(4)}/email`) : ""}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                  color="amber"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{totalCategories} categorized emails</p>
                    </div>
                  </div>
                  {pieData.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <ResponsiveContainer width={220} height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {pieData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={CATEGORY_COLORS[entry.name] || "#6b7280"}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full space-y-2.5">
                        {pieData.map((entry) => {
                          const pct = totalCategories > 0 ? Math.round((entry.value / totalCategories) * 100) : 0;
                          return (
                            <div key={entry.name} className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: CATEGORY_COLORS[entry.name] || "#6b7280" }}
                              />
                              <span className="text-sm text-gray-700 flex-1">{entry.name}</span>
                              <span className="text-sm font-medium text-gray-900">{entry.value}</span>
                              <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-10 text-gray-400">
                      <svg className="w-14 h-14 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      </svg>
                      <p className="text-sm font-medium">No categorized emails yet</p>
                      <p className="text-xs mt-1">Emails will appear here once analyzed</p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-900">Inbox Health</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Organization score</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center py-4">
                    <div className="relative w-44 h-44">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke={stats.inboxHealthScore >= 70 ? "#22c55e" : stats.inboxHealthScore >= 40 ? "#f59e0b" : "#ef4444"}
                          strokeWidth="10"
                          strokeDasharray={`${(stats.inboxHealthScore / 100) * 327} 327`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${stats.inboxHealthScore >= 70 ? "text-green-600" : stats.inboxHealthScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                          {stats.inboxHealthScore}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
                      </div>
                    </div>
                    <p className={`text-sm font-medium mt-4 ${stats.inboxHealthScore >= 70 ? "text-green-600" : stats.inboxHealthScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                      {stats.inboxHealthScore >= 70
                        ? "Your inbox is well organized"
                        : stats.inboxHealthScore >= 40
                          ? "Some emails need sorting"
                          : "Most emails need categorization"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.inboxHealthScore}% of emails have been categorized
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
