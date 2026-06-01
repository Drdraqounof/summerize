# Selective Gmail Folders

## Change Made

The app no longer shows an `All` folder/filter in the inbox.

Instead, Gmail fetches now follow the focus areas the user selected on the questions page.

---

## Why This Was Needed

The previous behavior always fetched multiple Gmail folders and still exposed an `All` view.

That made the inbox feel broader than the onboarding choices the user had already made.

The goal of this change was to keep the inbox aligned with user intent from onboarding.

---

## Current Behavior

- the inbox filter bar starts with `Matches`
- the `All` filter is removed
- Gmail folder requests are derived from selected focus areas
- if no focus area is available, the app falls back to `inbox`

---

## Current Focus-Area Mapping

- `work` -> `inbox`
- `deals` -> `promotions`
- `groceries` -> `updates`
- `events` -> `updates`

---

## Notes

This is a product mapping layer, not a Gmail-native setting chosen directly by the user.

If the app later needs more precise behavior, the questions flow should offer explicit folder choices instead of inferring them from focus areas.