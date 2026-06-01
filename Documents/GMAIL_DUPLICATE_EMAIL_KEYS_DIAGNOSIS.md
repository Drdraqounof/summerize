# Gmail Duplicate Email Keys - Diagnosis

## The Problem

The inbox was showing repeated React warnings like:

`Encountered two children with the same key`

The warnings referenced Gmail message ids such as:

- `19e5f9e03b5b5846`
- `19e5f7a531075a45`

This happened while rendering the email list in `app/components/EmailList.tsx`, where each row uses `email.id` as the React key.

---

## What This Means

React was receiving two or more email objects with the same `id` in the rendered inbox array.

The list component was not the root cause. It was correctly using `email.id` as the key. The real problem was that duplicate Gmail messages were entering application state before render.

---

## Local Evidence

### 1. The list key is based on `email.id`

In `app/components/EmailList.tsx`, each email row is rendered with:

- `key={email.id}`

That is correct as long as each email id is unique in the array.

### 2. Gmail messages are loaded from multiple label queries

In `app/providers.tsx`, the Gmail loader fetches these labels in parallel:

- `inbox`
- `spam`
- `promotions`
- `updates`

Those results are flattened into one array for the inbox.

### 3. The same Gmail message can appear in more than one query result

Because Gmail categories and search queries can overlap, the same Gmail message id can be returned by more than one label query.

That means a simple flatten of all results can produce duplicate message ids.

### 4. Previously saved session emails could also preserve duplicates

The provider restores emails from session storage on hydration.

If a duplicate set of emails had already been saved into session state before the fix, the inbox could keep rendering duplicates even after the Gmail merge logic was improved.

---

## Diagnosis

The duplicate-key warning came from two related sources:

1. Gmail results from multiple label queries were merged without deduplicating by message id.
2. Session-stored email state could restore those duplicates on later page loads.

So the root problem was not React keys themselves, but missing normalization at the email state boundary.

---

## Root Cause

The inbox depends on one shared `emails` array from `app/providers.tsx`.

That array was being populated from:

- merged Gmail query results
- restored session storage values
- later state updates such as analysis and read-state changes

Without consistent deduplication by `id`, the same Gmail message could survive into render multiple times.

---

## Fix Applied

The fix was applied in `app/providers.tsx`.

### 1. Deduplicate merged Gmail results by `id`

When Gmail label results are flattened together, they are now normalized into unique emails by message id before being stored.

### 2. Deduplicate restored session emails by `id`

When email state is restored from session storage, it is now normalized before being placed back into React state.

### 3. Deduplicate later provider updates by `id`

Provider updates such as:

- adding an email
- marking an email as read
- applying analysis results

now preserve uniqueness by id before saving state and session data.

---

## Why This Fix Is At The Right Layer

Fixing this only in `EmailList.tsx` would hide the symptom, not the cause.

The correct fix is in `app/providers.tsx`, because that is the boundary where inbox email state is assembled, restored, and updated.

That keeps the rendered email array valid everywhere else in the app.

---

## Validation

The provider file was validated with:

- `npx eslint app/providers.tsx`

Expected runtime outcome after refresh or reconnect:

- no repeated React duplicate-key warnings for Gmail ids
- inbox list renders one row per Gmail message id

---

## Remaining Notes

If duplicate-key warnings still appear after the fix, the next thing to verify is whether the browser session is still holding stale pre-fix email data.

In that case, a full refresh or reconnect flow should repopulate the session with normalized email state.