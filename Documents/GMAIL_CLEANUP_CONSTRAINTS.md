# Gmail Cleanup: Constraints and Planning

## Overview

This note captures what would be required to add a spam and trash cleanup feature to mailturtle.

The feature is possible, but the current app is not yet set up to modify Gmail mailbox state. Right now, the app can read Gmail messages and store local metadata, but it cannot move, trash, archive, or delete messages in Gmail.

---

## Current Constraints in This Repo

### 1. Gmail access is read-only

The current OAuth scope in `app/api/google/auth/route.ts` is:

- `https://www.googleapis.com/auth/gmail.readonly`

That means the app can read Gmail data, but it cannot:

- move messages to trash
- permanently delete messages
- archive messages
- add or remove Gmail labels
- mark Gmail messages as spam or not spam

### 2. Trash is not part of the current label surface

The Gmail messages route in `app/api/gmail/messages/route.ts` only allows:

- `inbox`
- `spam`
- `promotions`
- `updates`

`trash` is not currently supported in the allowed labels list.

### 3. The app already fetches multiple Gmail categories in parallel

The provider currently loads these labels together:

- `inbox`
- `spam`
- `promotions`
- `updates`

That means the app already has the basic pattern needed for a future combined cleanup view, but it does not yet include trash.

### 4. There is no delete implementation today

A Delete button exists in `app/components/EmailDetail.tsx`, but it is only UI. There is no `onClick` handler and no backend route that actually deletes or trashes Gmail messages.

### 5. The current Gmail fetch is limited in size

The Gmail list query in `app/api/gmail/messages/route.ts` uses `maxResults=20`.

That is fine for inbox preview, but it is not enough for a serious cleanup workflow if users want to process large amounts of spam or trash.

### 6. The current client-side email shape does not track trash/deleted state

The `Email` interface in `app/providers.tsx` includes `gmailLabel`, but it does not include a local trash or deleted state.

---

## What Can Be Done Now

Without changing Gmail permissions, the app can still support a limited version of cleanup behavior inside the app.

### App-level cleanup features possible now

- show spam messages in a separate review area
- add a combined review view that merges spam and other non-inbox categories already being fetched
- hide messages locally inside the app without deleting them from Gmail
- let users mark items as ignored in the local database
- add analytics like "messages that could be cleaned"
- add a non-destructive "review junk" workflow

### Read-only extension possible now

The app could also add `trash` as a readable label if the route is extended to support it, while still remaining read-only overall.

That would allow:

- reading Trash from Gmail
- showing Spam + Trash together in one app view
- letting users review junk in one place

But even with that change, the app still would not be able to delete or move messages until Gmail permissions are expanded.

---

## What Requires Additional Gmail Permissions

To actually change mailbox state, the app would need broader Gmail permissions.

### `gmail.modify`

This is the likely minimum write scope.

It would allow the app to:

- move messages to trash
- archive messages
- mark as spam or not spam
- add or remove labels
- update message state in Gmail

### More destructive delete flows

If the product ever supports permanent deletion, that should be treated as a higher-risk feature. Even if Gmail APIs allow the operation, the product decision needs stronger confirmation UX and much clearer user messaging.

### Scope consequences

Requesting write access changes the trust model of the app.

It means:

- users must re-consent
- privacy and terms docs should be updated
- the feature may require more careful Google app review depending on how scopes are used
- destructive operations must be designed carefully

---

## Decisions to Make Before Implementation

### 1. Is this a Gmail mutation feature or an app-only cleanup feature?

There are two different products here:

- **App-only cleanup view**
  The app groups spam and trash into one review screen, but does not modify Gmail.
- **True Gmail cleanup**
  The app moves, trashes, restores, or deletes messages in Gmail itself.

This is the first decision to settle, because it affects scopes, risk, and UX.

### 2. What does "delete" mean?

This needs to be explicit.

Possible meanings:

- move to Trash
- permanently delete from Trash
- remove from Spam
- clear only selected items
- clear all currently loaded items
- clear all matching Gmail items across pagination

Do not use one generic "Delete" action without defining the behavior.

### 3. Should Spam and Trash be treated the same?

They are related, but not identical.

- Spam is usually system-classified junk.
- Trash is usually user-deleted mail.

A combined app view makes sense, but the actions may need to differ.

### 4. Should bulk actions exist?

If the product supports "delete all," define:

- whether it affects only currently loaded rows
- whether it affects all matches in Gmail
- whether it supports preview/confirmation
- whether it can be undone

### 5. Should the local database track cleanup state?

If Gmail is modified, the local database needs a strategy for consistency.

Possible choices:

- keep deleted items with a local status
- remove them from the local database
- re-sync from Gmail and let Gmail be the source of truth
- maintain audit history of cleanup actions

### 6. What safety UX is required?

Before destructive actions, the product should likely include:

- confirmation modal
- count of affected emails
- source breakdown such as spam vs trash
- warning for permanent delete
- progress UI for bulk jobs
- partial failure handling

---

## Recommended Phased Approach

### Phase 1: Read-only cleanup view

Goal:
Create a merged Spam + Trash review surface without changing Gmail state.

Work:
- add readable support for `trash` in the Gmail messages route
- fetch spam and trash into one app view
- show source labels clearly
- add filtering and selection UI
- do not modify Gmail yet

Why first:
This gives users value with low risk and no scope change.

### Phase 2: App-level cleanup controls

Goal:
Let users dismiss or hide junk locally in the app.

Work:
- add local hidden/ignored state
- exclude hidden items from default inbox views
- allow restore inside the app
- keep Gmail unchanged

Why:
This tests the product behavior before requesting broader Gmail permissions.

### Phase 3: Gmail write actions

Goal:
Support actual mailbox changes.

Work:
- request `gmail.modify`
- add backend action routes for move-to-trash / restore / mark-not-spam
- connect the existing Delete button to real actions
- add confirmation UX and batching
- handle token expiry and re-consent

Why:
Only after the read-only and local patterns are stable should the app start modifying Gmail.

### Phase 4: Bulk cleanup

Goal:
Add safe bulk operations.

Work:
- support multi-select
- support delete selected
- support trash selected
- optionally support delete all shown
- add batching, retries, and progress tracking
- define hard limits and confirmation thresholds

Why:
Bulk deletion is the highest-risk operation and should come last.

---

## Risks and Tradeoffs

### Data loss risk

Permanent deletion is high risk. If this feature is implemented, the product should strongly prefer reversible actions first.

### Trust and permissions risk

Moving from read-only access to write access changes the user's trust model of the app.

### Sync complexity

If Gmail state changes and the local database is not updated correctly, the app will drift from Gmail.

### Pagination and scale

A cleanup workflow cannot rely on the current `maxResults=20` limit if the goal is large-scale cleanup.

### API quota and failure handling

Bulk Gmail operations will require batching, retries, and clear user feedback on partial failures.

### Product confusion

If the app only hides emails locally, users may expect Gmail itself to be cleaned too. The UI must make that distinction obvious.

---

## Recommendation

The safest path is:

1. build a read-only combined Spam + Trash review view
2. test whether users actually use the cleanup surface
3. add local hide/dismiss behavior if needed
4. request Gmail write permissions only if true mailbox mutation is clearly worth the added risk and complexity