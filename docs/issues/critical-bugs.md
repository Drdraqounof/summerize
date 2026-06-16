# Critical Bugs — Dashboard Backend

## 1. `isStarred` field mismatch in `email-analysis.ts`

**File:** `lib/email-analysis.ts:168`

**Problem:** `persistAnalysisResult` writes `isStarred: result.isStarred` into the `prisma.email.update` data, but the `Email` model in `schema.prisma` has `isFlagged`, not `isStarred`. This causes a Prisma validation error on every analysis persistence — **AI star assignments are silently broken**.

```typescript
// Current (broken):
const data: Record<string, unknown> = {
    summary: result.summary,
    analyzedAt: new Date(),
    isStarred: result.isStarred,  // ❌ field doesn't exist on Email model
};
```

**Fix:** Change to `isFlagged: result.isStarred` (map AI's `isStarred` to Prisma's `isFlagged`).

---

## 2. `getPreviousPeriodStart` computes wrong window in `dashboard-stats.ts`

**File:** `lib/dashboard-stats.ts:31-37`

**Problem:** The function is meant to return the start of the *previous* period (for trend comparison), but the math is broken:

```typescript
function getPreviousPeriodStart(period, periodStart) {
    const diff = periodStart === new Date(0) ? 30 : periodStart.getTime();
    //                                 ^^^ object reference comparison, ALWAYS false
    const now = new Date();  // unused
    const prevEnd = new Date(periodStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);
    // prevStart ≈ epoch - 1ms, so previousTotal counts ALL emails ever
    return prevStart;
}
```

Because `periodStart === new Date(0)` compares object references (always `false`), `diff` is always `periodStart.getTime()` (milliseconds since epoch). Then `prevStart = (periodStart - 1) - periodStart.getTime()` ≈ near the Unix epoch. This means `previousTotal` in the trend calculation includes **every email ever synced** — making the percent change wildly inaccurate.

**Fix:** Use `periodStart.getTime() === 0` for the epoch check, and compute the proper offset:

```typescript
function getPreviousPeriodStart(period, periodStart) {
    const periodDuration = period === "week" ? 7 : period === "month" ? 30 : 0;
    if (periodDuration === 0) return periodStart; // "all" — no previous period
    const prevEnd = new Date(periodStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodDuration * 24 * 60 * 60 * 1000);
    return prevStart;
}
```

---

## 3. No authentication on stats & sync API endpoints

**Files:**
- `app/api/dashboard/stats/route.ts`
- `app/api/sync/route.ts`

**Problem:** Both endpoints accept a plain `userEmail` query parameter or body field with **no session verification, bearer token, or cookie check**. Anyone who knows (or guesses) a user's email address can:
- View their dashboard statistics
- Trigger a Gmail sync
- See email volume and category breakdowns

```typescript
// Current — no auth:
const userEmail = searchParams.get("userEmail")?.trim().toLowerCase();
// No session/cookie/token check before proceeding
```

**Fix:** Verify the caller's session before returning data. Options (in order of preference):
1. Use an HTTP-only session cookie set at login (most secure)
2. Verify a bearer token from `sessionStorage` against the DB
3. At minimum, check that the requesting IP/user-agent matches the last login

**Severity:** High — data exposure vulnerability.
