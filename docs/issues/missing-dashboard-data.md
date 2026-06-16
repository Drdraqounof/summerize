# Missing Dashboard Data

## 4. `costThisPeriod` fetched but never displayed

**Files:**
- `lib/dashboard-stats.ts:13` — field defined in the interface
- `app/dashboard/page.tsx` — never rendered

**Problem:** The `DashboardStats` interface includes `costThisPeriod`, the API returns it, but the dashboard UI never shows it. Users have no visibility into their AI spending.

---

## 5. Top rule matching uses fragile substring match

**File:** `lib/dashboard-stats.ts:117-127`

**Problem:** The top rule's match count is computed by checking `matchReason: { contains: topRuleData.name }` — a case-insensitive substring match against the AI-generated `matchReason` free-text field. If GPT writes "Important client update" and the rule is named "VIP Clients", it won't match even if the rule correctly categorized the email. Conversely, a short rule name might produce false positives (e.g., rule "Work" matching "Work-related" in a totally different context).

```typescript
const matchCount = await prisma.email.count({
    where: {
        userId,
        matchReason: { contains: topRuleData.name, mode: "insensitive" },
        receivedAt: { gte: periodStart },
    },
});
```

**Fix:** Track which rule was applied per email using a new field or junction table (e.g., `appliedRuleId` on `Email`), rather than reverse-engineering from AI output.

---

## 6. UserActivity data unused in dashboard

**File:** `prisma/schema.prisma:165-178`

**Problem:** The `UserActivity` model tracks daily `emailsAnalyzed`, `aiCallsMade`, and `tokenUsed` — perfect data for the dashboard. But the dashboard stats query never touches this table, instead recomputing everything from raw `Email` records. This is redundant and misses the opportunity for daily-aggregated metrics.

---

## 7. No quota information on dashboard

**File:** `prisma/schema.prisma:180-195`

**Problem:** The `UserQuota` model stores monthly `callsUsed`, `callsLimit` (10k), `costUsed`, and `costLimit` ($100). But no API endpoint exposes this data, and the dashboard doesn't show remaining quota or approaching-limit warnings.

---

## 8. Period changes re-trigger full sync

**File:** `app/dashboard/page.tsx:99-108`

**Problem:** Every time the user changes the period filter (Week/Month/All), the dashboard calls `POST /api/sync` before fetching stats. This means:
- Switching from Week to Month re-syncs the same week data
- Switching back re-syncs again
- No cache invalidation or staleness check
- User waits for sync + analysis on every filter toggle

```typescript
// Called on every period change:
const syncRes = await fetch("/api/sync", {
    method: "POST",
    body: JSON.stringify({ userEmail: user, period }),
});
```

**Fix:** Add a `lastSyncedAt` timestamp and only re-sync if stale (e.g., > 5 min old). Show a "refresh" button for manual re-sync.
