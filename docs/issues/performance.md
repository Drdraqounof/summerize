# Performance Issues — Dashboard Backend

## 9. `dailyVolume` fetches ALL emails for JS-side grouping

**File:** `lib/dashboard-stats.ts:96-101`

**Problem:** The daily volume chart is built by fetching **every email** in the period with `prisma.email.findMany({ select: { receivedAt: true } })` and then grouping by date in JavaScript with a `Map`. For users with 10k+ emails, this pulls all those rows from the database and processes them client-side in the serverless function.

```typescript
// Current — pulls ALL rows into memory:
const dailyData = await prisma.email.findMany({
    where: { userId, receivedAt: { gte: periodStart } },
    select: { receivedAt: true },
    orderBy: { receivedAt: "asc" },
});
// ... then groups in JS with a Map
```

**Fix:** Use Prisma raw query or a SQL `GROUP BY DATE(receivedAt)` to push aggregation to the database:

```sql
SELECT DATE(receivedAt) as date, COUNT(*) as count
FROM "Email"
WHERE "userId" = ? AND "receivedAt" >= ?
GROUP BY DATE(receivedAt)
ORDER BY date ASC
```

---

## 10. Sequential label sync — no concurrency

**File:** `app/api/sync/route.ts:61-69`

**Problem:** The sync endpoint loops over 5 labels (`inbox`, `spam`, `promotions`, `updates`, `trash`) sequentially. For "all" period with `maxPerLabel: 2000`, this fetches up to 10k individual email detail requests (2000 list calls + 2000 detail calls) one label at a time.

```typescript
// Current — fully sequential:
for (const label of labels) {
    const result = await syncGmailLabel(accessToken, email, user.id, label, since, maxPerLabel);
    totalSynced += result.synced;
}
```

**Fix:** Run label syncs in parallel with a concurrency limit (e.g., `Promise.allSettled` with max 2-3 in-flight).

---

## 11. Sync timeout risk for large accounts

**File:** `app/api/sync/route.ts`

**Problem:** A single sync request does:
1. 5 label API fetches (potentially 10k individual HTTP requests to Gmail)
2. OpenAI batch analysis on all unanalyzed emails

On serverless platforms (Vercel, Netlify) with 10-30s function timeouts, this will frequently time out for users with large inboxes. There's:
- No timeout handling
- No progress reporting to the client
- No chunking or incremental sync

**Fix options:**
- Add a `maxEmails` cap to the sync (e.g., sync newest 100 emails per label per request)
- Return partial results with a `truncated` flag so the frontend can re-trigger
- Use a queue/background worker for heavy syncs
- Add a WebSocket or polling endpoint for sync progress
