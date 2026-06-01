# PWA Service Worker 404 In Development

## The Problem

During local development, the browser console showed warnings like:

- `HEAD /sw.js 404`
- `[PWA] Service worker file not found (404)`

These messages were coming from `app/components/PWARegister.tsx`.

---

## What This Means

The app was attempting to check for `/sw.js` during development, but the service worker file was not available at that time.

This did **not** mean the inbox, Gmail connection flow, or API routes were broken. It only meant the PWA registration path was being probed in an environment where the service worker file was not being served.

---

## Root Cause

`PWARegister` manually performs a `HEAD` request to `/sw.js` before trying to register a service worker.

That is a safe production check, but in local development it created noisy warnings because the service worker file was not present.

---

## Fix Applied

A light fix was added in `app/components/PWARegister.tsx`:

- skip service worker registration entirely outside production
- mark registration as attempted so the check does not keep retrying
- keep production registration behavior unchanged

---

## Why This Is A Safe Fix

The warning was only about development-time PWA setup noise.

Skipping service worker registration in development:

- removes the repeated `sw.js` 404 warnings
- avoids confusing console noise while testing Gmail and inbox flows
- does not change production PWA behavior
- does not affect core app functionality

---

## Expected Result

After this change, local development should no longer log:

- `HEAD /sw.js 404`
- `[PWA] Service worker file not found (404)`

Production can still register the service worker normally.