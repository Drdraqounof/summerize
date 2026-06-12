# Codebase Issues

## 1. Missing `next-auth` dependency

**Files affected:**
- `app/api/rules/route.ts` — imported `getServerSession` from `next-auth/next`
- `app/api/rules/[id]/route.ts` — imported `getServerSession` from `next-auth/next`
- `app/settings/page.tsx` — imported `useSession` from `next-auth/react`

**Root cause:** The project uses a custom auth system (sessionStorage + `useEmail` context + email-based user lookup), but some files were written assuming `next-auth` was installed.

**Fix:** Replaced all `next-auth` imports with the project's existing auth pattern:
- API routes now accept `userEmail` as a query param (GET/DELETE) or body field (POST/PATCH)
- Client components use `useEmail()` context or `getSessionItem()` from `@/lib/client-session`

---

## 2. Prisma model/database column mismatches

The Prisma schema was updated with new fields (`enabled`, `priority`, `isStarred`) but the database was never migrated, so the actual database columns don't exist.

### 2a. `CustomRule.enabled` column doesn't exist

**Files affected:** `lib/dashboard-stats.ts`, `app/api/rules/route.ts`, `app/api/rules/[id]/route.ts`

**Fix:** Use `isActive` instead of `enabled` for CustomRule queries until a migration is run.

### 2b. `CustomRule.priority` column doesn't exist

**Files affected:** `lib/dashboard-stats.ts`, `app/api/rules/route.ts`, `app/api/rules/[id]/route.ts`

**Fix:** Removed `orderBy: { priority: "desc" }` from queries.

### 2c. `Email.isStarred` column doesn't exist

**Files affected:** `lib/dashboard-stats.ts`

**Fix:** Changed `isStarred` to `isFlagged` in the starred emails count query (the `isFlagged` field exists in both schema and database).

---

## 3. `emailRecord.receivedAt` can be null

**File:** `app/api/gmail/messages/route.ts:292`

**Root cause:** The Prisma schema defines `receivedAt` as `DateTime?` (nullable), but the code called `.toISOString()` on it without a null check.

**Error:** `RangeError: Invalid time value`
```
date: emailRecord.receivedAt.toISOString(),
```

**Fix:** Added optional chaining with a fallback:
```ts
date: emailRecord.receivedAt?.toISOString() ?? new Date(0).toISOString(),
```

---

## 4. Settings page used `next-auth` auth model

**File:** `app/settings/page.tsx`

**Issues:**
- Used `useSession()` from `next-auth/react`
- Used `Link` from `next/link` with hardcoded `/inbox` back link
- Referenced `session.user?.email` for user display

**Fix:** Rewrote to use `useEmail()` context and `getSessionItem()` from the project's own auth system. Back navigation uses `router.back()`. User display uses the `user` value from context.

---

## 5. `next-auth` references in `RuleManager`

**File:** `app/components/RuleManager.tsx`

**Issue:** The component fetched `/api/rules` without passing user identification, expecting the server to extract the user from a `next-auth` session.

**Fix:** Added `useEmail()` context import and passes `userEmail` as query param or body field on all API calls.

---

## Summary of changes

| File | Issue | Fix |
|---|---|---|
| `app/api/rules/route.ts` | `next-auth/next` import | Replaced with `userEmail` param-based auth |
| `app/api/rules/[id]/route.ts` | `next-auth/next` import | Replaced with `userEmail` param-based auth |
| `app/settings/page.tsx` | `next-auth/react` import | Rewrote to use `useEmail()` context |
| `app/components/RuleManager.tsx` | No user context in API calls | Added `userEmail` to all requests |
| `lib/dashboard-stats.ts` | `isStarred`, `enabled`, `priority` columns | Switched to existing columns |
| `app/api/gmail/messages/route.ts` | Null `receivedAt` crash | Added null-safe fallback |

## Remaining: Prisma schema vs database drift (BLOCKING)

The Prisma schema was updated with new fields (`enabled`, `priority`, `isStarred`, `conditions` as JSON, `actions` as JSON) but the database **was never migrated**. The actual database only has the legacy columns (`isActive`, `ruleType`, `condition`, `targetCategory`).

This blocks the rules API and rule-engine completely.

**Fix needed:**

```bash
npx prisma db push
```

This will create all missing columns in the PostgreSQL database to match the Prisma schema (`prisma/schema.prisma`), including:
- `CustomRule.enabled` (Boolean)
- `CustomRule.priority` (Int)
- `CustomRule.conditions` (Json)
- `CustomRule.actions` (Json)
- `Email.isFlagged` (Boolean)

After running this, restart the dev server. All Prisma queries that reference these columns will work.

**Alternative** (if you want to avoid migration): Rewrite all queries to use only legacy columns (`isActive`, `ruleType`, `condition`, `targetCategory`) and adapt the rule engine accordingly. This approach was attempted with shims (`isActive` for `enabled`) but the new `conditions`/`actions` JSON columns cannot be shimmed — the rule engine depends on them.
