# Minor UX Issues — Dashboard

## 12. Trend shows "↑ 0%" on empty inbox

**File:** `lib/dashboard-stats.ts:129-135`

**Problem:** When `previousTotal === 0` (no previous period data), the trend is set to `{ direction: "up", percent: 0 }`. The UI then renders "↑ 0%" as a badge on the "Emails Processed" card, which is confusing — it looks like an error or placeholder.

```typescript
// Current:
: { direction: "up", percent: 0 };
```

**Fix:** Either set `trend` to `null` when there's no meaningful comparison, or don't render the trend badge when `percent === 0`.

---

## 13. `estimatedTimeSaved` is a flat 2 min/email multiplier

**File:** `lib/dashboard-stats.ts:112`

**Problem:** Time saved is calculated as `totalEmails * 0.033` hours (~2 minutes per email), regardless of email length, category, or actual reading time. A 1-line confirmation email and a 10-paragraph newsletter get the same "savings".

```typescript
const estimatedTimeSaved = Math.round(totalEmails * 0.033 * 10) / 10;
```

**Considerations:**
- Short emails (< 50 words) could be 30s
- Long emails (> 500 words) could be 5 min
- The value is just a heuristic, but a range-based estimate would feel more accurate

**Fix:** Use a tiered formula based on body length.

---

## 14. `inboxHealthScore` is only categorization percentage

**File:** `lib/dashboard-stats.ts:108-110`

**Problem:** The health score is a single metric: `categorizedCount / totalEmails * 100`. A real "inbox health" score could factor in:
- Spam-to-inbox ratio
- Read/unread ratio
- Flagged/starred utilization
- Response time
- Rule coverage

```typescript
const inboxHealthScore = totalEmails > 0
    ? Math.round((categorizedCount / totalEmails) * 100)
    : 0;
```

**Fix:** Weighted composite score using multiple signals.

---

## 15. No daily volume drill-down or filtering

**File:** `app/dashboard/page.tsx:381-415`

**Problem:** The daily volume bar chart is static. Users can see volume per day but cannot:
- Click a bar to see that day's emails
- Filter the chart by category
- Toggle between bar and line chart views
- Group by week or month
