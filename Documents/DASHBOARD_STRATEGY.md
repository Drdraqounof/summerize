# Dashboard Strategy Guide

## Overview

This document outlines the dashboard strategy for Summerize - an AI-powered email management system. The dashboard provides users with insights into their email organization, automation effectiveness, and productivity metrics.

---

## Part 1: Key Metrics for Your Email App

### Core Usage Metrics

- **Emails Processed** - Total this period (week/month), trend vs last period
- **Emails Starred** - How many flagged as important by AI
- **Categories Breakdown** - Work, Personal, Promotions, Alerts, Other (pie chart)
- **Inbox Health Score** - % organized/categorized (0-100%)

### Time & Productivity Metrics

- **Time Saved** - Estimated hours reading/sorting (based on emails processed)
- **Notification Frequency** - Digest delivery stats, open rates
- **Most Active Time** - When user gets most emails

### Rules & Automation Metrics

- **Rules Active** - Count of automation rules enabled
- **Rule Effectiveness** - Emails matched by rules vs AI
- **Top Matching Rule** - Which rule catches most emails

### Cost & Performance Metrics

- **AI API Cost** - This month vs budget (since you use OpenAI)
- **Analysis Speed** - Avg time per email
- **Accuracy** - Rules confidence scores

---

## Part 2: Recommended Dashboard Layout

### Simple 3-Section Design (Easy to Understand)

```
┌─ HEADER ────────────────────────────────┐
│ This Week    |    This Month    |  All Time  │
└──────────────────────────────────────────┘

┌─ TOP ROW (4 Cards) ──────────────────────┐
│ Emails      │  Starred   │  Time      │  Rules  │
│ Processed   │  Emails    │  Saved     │  Active │
│    247      │     32     │  3.2 hrs   │   5     │
└──────────────────────────────────────────┘

┌─ MIDDLE ROW (Charts) ────────────────────┐
│ Category      │  Inbox Health  │  Top    │
│ Breakdown     │  Score: 78%    │ Rule    │
│ (Pie Chart)   │  (Gauge)       │ Performance
└──────────────────────────────────────────┘

┌─ BOTTOM ROW (Trends) ────────────────────┐
│ Email Volume Trend     │  Weekly Pattern  │
│ (Line Chart)          │ (Bar Chart)      │
└──────────────────────────────────────────┘
```

### Layout Principles

1. **Top Cards First** - High-level overview at a glance
2. **Charts Below** - Visual trends and breakdowns
3. **Trends at Bottom** - Historical context and patterns

---

## Part 3: Timeline Estimates

### Complexity Levels

| Complexity | Time | What's Included |
|-----------|------|-----------------|
| **Basic** | 2-3 days | 4 stat cards + 1 pie chart, static data |
| **Standard** | 4-5 days | Above + trend lines + date filters + real-time updates |
| **Advanced** | 6-8 days | Above + comparative analytics + rule insights + customizable widgets |

### Your Timeline Advantage

Your current codebase provides:
- ✅ Database with all needed fields
- ✅ Prisma ORM for queries
- ✅ User authentication
- ✅ Tailwind CSS styling
- ✅ React/Next.js setup

**Expected realistic timeline: 1 full day (basic), or spread across 2-3 days (standard)**

---

## Part 4: Design Principles for Clarity

### 1. Cards with Context

Structure each stat card with three levels of information:

```jsx
<DashboardCard>
  <Title>Emails Processed</Title>
  <BigNumber>247</BigNumber>
  <Trend>↑ 12% vs last week</Trend>
  <Context>Average: 35/day</Context>
</DashboardCard>
```

**Why this works:**
- User sees number first (quick scan)
- Trend shows if it's good or bad
- Context answers "Is this normal?"

### 2. Color Coding System

Use consistent colors across dashboard:

- **Green** - Good (high organization, low spam)
- **Blue** - Info (stats, counts, neutral data)
- **Yellow** - Warning (high unread, low rule engagement)
- **Red** - Action needed (over quota, errors, issues)

### 3. Progressive Disclosure

Show information in layers - don't overwhelm:

```
Level 1: Just the number (247)
Level 2: With context (↑ 12% vs last week)
Level 3: With chart (trend line showing history)
Level 4: With details (breakdown by time, category, etc.)
```

Users can drill down without cluttering the main view.

### 4. Time Period Toggle

Always include period selector prominently:

```
[This Week] [This Month] [All Time]
```

This helps users immediately answer "Is this normal?"

### 5. Actionable Insights Over Raw Data

Transform metrics into actionable information:

```
❌ Bad: "Rules matched 85 emails"
✅ Good: "Your rules saved you 2.8 hours this week"

❌ Bad: "Inbox health score: 78%"
✅ Good: "78% organized (7% better than last week)"

❌ Bad: "API calls: 8,432"
✅ Good: "Cost: $4.21 this month (on budget)"
```

---

## Part 5: Data Already Available

You already track all necessary data:

```typescript
// From Email model:
- email.analyzedAt      // When processed
- email.category        // Work|Personal|Promotions|Alerts|Other
- email.isStarred       // Starred by AI
- email.shouldNotify    // Flagged for notification
- email.summary         // AI summary

// From CustomRule model:
- rule.conditions       // What rule matches
- rule.actions          // What it does
- rule.enabled          // Is it active
- rule.createdAt        // When created

// From AIInteraction model:
- interaction.tokensUsed    // For cost calculation
- interaction.estimatedCost // Cost per analysis
- interaction.responseTime  // Performance metric

// From UserActivity model:
- activity.emailsAnalyzed   // Daily count
- activity.aiCallsMade      // Daily usage
- activity.date             // Tracking date

// From UserPreference model:
- preference.notificationFrequency  // User settings
- preference.focusAreas             // What user cares about
```

**No additional data collection needed** - just aggregate what exists.

---

## Part 6: Recommended Tech Stack

### For Summerize (lightweight approach)

1. **Charting Library: Recharts**
   - Already pairs well with React
   - Minimal bundle size (~60KB)
   - Built-in animations
   - Great TypeScript support
   - Works perfectly with Tailwind

2. **Date Handling: date-fns**
   - Already standard in your project
   - Lightweight alternative to moment.js
   - Perfect for time range queries

3. **UI Components**
   - Use your existing Tailwind setup
   - Create simple Card component
   - Metric/Stat card component
   - Period selector component

4. **Data Fetching: Built-in React + Fetch**
   - No extra dependencies needed
   - Optional: Add `react-query` for polling if you want real-time updates

---

## Part 7: Step-by-Step Build Plan

### Phase 1: Data Aggregation Layer (4-6 hours)

**File: `lib/dashboard-stats.ts`**

```typescript
export interface DashboardStats {
  period: 'week' | 'month' | 'all';
  emailsProcessed: number;
  starredEmails: number;
  categoryBreakdown: Record<string, number>;
  inboxHealthScore: number;
  rulesActive: number;
  estimatedTimeSaved: number;
  costThisPeriod: number;
  topRule: { name: string; matchCount: number } | null;
  trend: { direction: 'up' | 'down'; percent: number };
}

export async function getDashboardStats(
  userId: string,
  period: 'week' | 'month' | 'all'
): Promise<DashboardStats> {
  // Queries to implement:
  // 1. Count emails by analyzedAt date
  // 2. Count starred emails
  // 3. Group emails by category
  // 4. Calculate inbox health score
  // 5. Count active rules
  // 6. Estimate time saved (emails * avg_read_time)
  // 7. Sum API costs from AIInteraction
  // 8. Find top performing rule
}
```

### Phase 2: API Endpoint (2-3 hours)

**File: `app/api/dashboard/stats/route.ts`**

```typescript
export async function GET(request: NextRequest) {
  // Get user session
  // Extract period from query params
  // Call getDashboardStats
  // Return JSON
  // Handle errors
}
```

**Query Parameters:**
- `period` - week | month | all (default: week)
- `compare` - true/false (return comparison with previous period)

### Phase 3: Dashboard Page (4-6 hours)

**File: `app/dashboard/page.tsx`**

Components to build:
1. **PeriodSelector** - Week/Month/All Time buttons
2. **StatCard** - Reusable card for single metric
3. **CategoryChart** - Pie chart of email categories
4. **TrendChart** - Line chart of email volume over time
5. **HealthScore** - Gauge showing inbox organization %
6. **RulesList** - Top performing rules

### Phase 4: Polish & Refinement (2-4 hours)

- Add loading states
- Add error handling
- Mobile responsive design
- Animations/transitions
- Auto-refresh logic (optional)

---

## Part 8: Example Component Implementation

### StatCard Component

```tsx
interface StatCardProps {
  title: string;
  value: number | string;
  trend?: { direction: 'up' | 'down'; percent: number };
  context?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export default function StatCard({
  title,
  value,
  trend,
  context,
  icon,
  color = 'blue',
}: StatCardProps) {
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
  }[color];

  const textColor = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900',
  }[color];

  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : 'text-red-600';

  return (
    <div className={`rounded-lg p-4 ${bgColor} border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>
            {value}
          </p>
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      {trend && (
        <p className={`text-xs mt-2 ${trendColor}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.percent}%
          vs last period
        </p>
      )}
      {context && (
        <p className="text-xs text-gray-500 mt-1">{context}</p>
      )}
    </div>
  );
}
```

### Dashboard Page Structure

```tsx
export default function DashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, [period]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Emails Processed"
          value={stats.emailsProcessed}
          trend={stats.trend}
          context={`Avg: ${Math.round(stats.emailsProcessed / 7)}/day`}
          icon="📧"
          color="blue"
        />
        {/* More cards... */}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryChart data={stats.categoryBreakdown} />
        <HealthScore score={stats.inboxHealthScore} />
      </div>

      {/* Trends */}
      <TrendChart />
    </div>
  );
}
```

---

## Part 9: Estimated Effort Breakdown

| Component | Time | Difficulty | Notes |
|-----------|------|-----------|-------|
| API endpoint | 2-3 hrs | Easy | Most time is writing Prisma queries |
| 4 stat cards | 1-2 hrs | Easy | Reusable component |
| Pie chart | 1 hr | Easy | Recharts handles complexity |
| Trend line | 1-2 hrs | Medium | Need to structure time-series data |
| Period selector | 30 min | Easy | Just buttons and state |
| Mobile responsive | 1 hr | Easy | Tailwind grid responsive |
| **TOTAL** | **6-9 hrs** | **Overall: Medium** | Realistic: 1-2 full days |

---

## Part 10: Key Implementation Decisions

### 1. Default Time Period

**Recommendation: This Week**

- Shows recent trends
- More relevant to users
- Less data to aggregate initially

### 2. Primary Metric

**Recommendation: "Time Saved"**

- Most motivating for users
- Clear ROI message
- Easy to understand

### 3. Auto-Refresh Strategy

**Recommendation: 5-minute poll**

- Shows live activity without overwhelming
- Not too battery-intensive for mobile
- Updates feel fresh

### 4. Mobile Support

**Recommendation: Stack vertically, hide trend charts on small screens**

```tsx
// Use Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Cards stack on mobile, 4 across on desktop */}
</div>

// Hide complex charts on mobile
<div className="hidden md:block">
  <TrendChart />
</div>
```

---

## Part 11: Future Enhancements

### Phase 2 Ideas (Post-Launch)

1. **Comparative Analysis**
   - Compare this week vs last week
   - Month-over-month trends
   - Year-to-date summaries

2. **Rule Analytics**
   - Which rules are most effective
   - Rules that catch spam vs legitimate emails
   - Time-to-execute for each rule

3. **Customizable Dashboard**
   - Let users choose which metrics to display
   - Save custom layouts
   - Export reports

4. **Notifications**
   - Alert if inbox health drops below threshold
   - Notify on unusual activity
   - Weekly digest of dashboard

5. **Comparative Benchmarks**
   - "Your inbox health is better than 82% of users"
   - "You process 40% more emails than average"

---

## Part 12: Success Metrics

How will you know the dashboard is working?

- **Engagement** - Users visit dashboard regularly (>1x/week)
- **Action** - Users create rules based on dashboard insights
- **Retention** - Dashboard viewers have higher retention rate
- **Satisfaction** - Dashboard appears in user feedback positively

---

## Part 13: Database Query Examples

### Get Emails Processed This Week

```sql
SELECT COUNT(*) 
FROM "Email" 
WHERE "userId" = $1 
AND "analyzedAt" > NOW() - INTERVAL '7 days'
```

### Category Breakdown

```sql
SELECT 
  "category",
  COUNT(*) as count
FROM "EmailCategoryRecord"
WHERE "emailId" IN (
  SELECT "id" FROM "Email" 
  WHERE "userId" = $1 
  AND "analyzedAt" > NOW() - INTERVAL '7 days'
)
GROUP BY "category"
```

### Calculate Inbox Health

```sql
SELECT 
  COUNT(CASE WHEN "category" IS NOT NULL THEN 1 END)::float / 
  COUNT(*)::float * 100 as health_score
FROM "Email"
WHERE "userId" = $1
AND "analyzedAt" > NOW() - INTERVAL '7 days'
```

### API Cost This Month

```sql
SELECT SUM("estimatedCost")
FROM "AIInteraction"
WHERE "userId" = $1
AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
```

---

## Part 14: Next Steps

1. **Decide on scope** - Basic, Standard, or Advanced?
2. **Finalize metrics** - Which 5-7 metrics matter most?
3. **Design mockups** - Sketch dashboard layout
4. **Build data layer** - Start with aggregation functions
5. **Create API** - Build stats endpoint
6. **Build components** - Create cards and charts
7. **Test & refine** - Gather user feedback
8. **Deploy** - Ship to production

---

**Status:** Ready to build  
**Estimated Time to Launch:** 1-3 days depending on scope  
**Recommended First Step:** Start with Part 1 - Build data aggregation layer
