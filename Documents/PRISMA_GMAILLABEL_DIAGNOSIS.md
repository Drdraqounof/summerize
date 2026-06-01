# Prisma `gmailLabel` Upsert Error - Diagnosis

## The Problem

You're seeing this Prisma error when loading Gmail messages:

`Unknown argument gmailLabel`

The failure happens in `app/api/gmail/messages/route.ts` during `prisma.email.upsert()`.

---

## What This Means

The application is trying to write an `Email.gmailLabel` field, but the running Prisma client does not recognize that field in the generated `EmailCreateInput` and `EmailUpdateInput` types.

This is a schema drift problem.

---

## Local Evidence

### 1. The Prisma schema does define `gmailLabel`

In `prisma/schema.prisma`, the `Email` model includes:

- `gmailLabel String? @default("inbox")`

The model also has an index on that field.

### 2. The Gmail messages route intentionally writes `gmailLabel`

In `app/api/gmail/messages/route.ts`, the route builds each email record with:

- `gmailLabel: label`

Then the route sends `gmailLabel` in both:

- `update`
- `create`

So this is not an accidental field name in the route. The code is intentionally using it.

### 3. Migration history never added the column

The initial `Email` table creation in `prisma/migrations/20260429185018_init_mailturtle/migration.sql` does not include `gmailLabel`.

A later `Email` table change in `prisma/migrations/20260518150000_add_resend_notifications/migration.sql` adds `shouldNotify` and `matchReason`, but still does not add `gmailLabel`.

---

## Diagnosis

The repo has two layers of drift:

1. Missing database migration
   The Prisma schema says `Email.gmailLabel` exists, but the migration history does not add that column to the database.
2. Stale generated Prisma client
   The runtime Prisma client being used by the Next.js server still has an `Email` input shape without `gmailLabel`, which is why Prisma throws `Unknown argument gmailLabel` before the query runs.

---

## Root Cause

The `Email` model was updated in `prisma/schema.prisma`, but the supporting migration and regenerated client were not brought into sync.

---

## Recommended Fix

### 1. Add a Prisma migration for `gmailLabel`

The `Email` table needs a new column that matches the schema definition.

Expected shape:

- Column name: `gmailLabel`
- Type: text / string
- Nullable
- Default: `"inbox"`

### 2. Regenerate Prisma client

After the migration is added, regenerate Prisma so the client knows about `gmailLabel`.

### 3. Restart the dev server

The running Next.js process may still be holding the stale generated client.

### 4. Re-test the failing route

Re-run the same request that failed:

- `/api/gmail/messages?...&label=updates...`

Expected result:

- no Prisma validation error
- successful upsert
- `Email` records persist with `gmailLabel`

---

## Why Removing `gmailLabel` From Code Is Not The Right Fix

Removing `gmailLabel` from the route would only hide the drift.

The field is already part of the Prisma model in `prisma/schema.prisma`, and the route in `app/api/gmail/messages/route.ts` is intentionally capturing Gmail folder context.

The safer fix is to bring the migration history and generated client into alignment with the schema.

---

## Summary

This error is caused by Prisma schema drift:

- schema includes `gmailLabel`
- route uses `gmailLabel`
- migrations do not add `gmailLabel`
- running Prisma client is stale and rejects the field

The correct fix is:

1. add the missing migration
2. regenerate Prisma client
3. restart the app
4. test the Gmail messages route again