# Google OAuth redirect_uri_mismatch - Troubleshooting Guide

## The Problem

You're seeing: `Error 400: redirect_uri_mismatch`

This means **the redirect URI your app is sending to Google doesn't match what's registered in Google Cloud Console**.

---

## Step 1: Find Your Actual Redirect URI

Check your server logs when trying to login. Look for this line:

```
[Google Auth] Redirect URI being sent to Google: http://localhost:3000/api/google/callback
```

**Copy that exact URL** - it must match Google Cloud Console perfectly.

---

## Step 2: Update Google Cloud Console

### Go to Google Cloud Console:
1. Open https://console.cloud.google.com/
2. **Select your project** at the top
3. Go to **APIs & Services** → **Credentials** (left sidebar)
4. Find your **OAuth 2.0 Client ID** (look for type "Web application")
5. **Click on it to edit**

### Update Redirect URIs:
1. Find the **"Authorized redirect URIs"** section
2. **Add or replace with your actual URI:**

```
http://localhost:3000/api/google/callback
```

**⚠️ IMPORTANT CHECKS:**
- ✅ Starts with `http://` (or `https://` if using HTTPS)
- ✅ Uses correct domain/port (`localhost:3000` for local development)
- ✅ Ends with `/api/google/callback`
- ✅ **NO trailing slash at the end** (after `callback`)
- ✅ **Matches EXACTLY** what you saw in the logs

### Example Valid URIs:
```
Development:
http://localhost:3000/api/google/callback
http://127.0.0.1:3000/api/google/callback

Production:
https://myapp.com/api/google/callback
https://www.myapp.com/api/google/callback
```

### Example INVALID URIs:
```
❌ http://localhost:3000/api/google/callback/    (trailing slash)
❌ http://localhost/api/google/callback           (no port)
❌ https://localhost:3000/api/google/callback     (http vs https mismatch)
❌ http://localhost:3000/api/google/              (wrong path)
```

---

## Step 3: Restart Your App

After updating Google Cloud Console:

1. **Restart the dev server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache** (or open in private/incognito window)

3. **Try logging in again**

---

## Step 4: Debug Output

If you still see the error, check these server logs:

```
[Google Auth] Redirect URI being sent to Google: <-- This is what your app sent
[Google Callback] Using redirect_uri for token exchange: <-- This is what callback used
[Google Callback] REDIRECT_URI_MISMATCH ERROR! <-- Detailed error message
```

**Compare these URIs exactly.** They must match what's in Google Cloud Console.

---

## Common Mistakes

### ❌ Using Google's error message from the browser
The error page shows generic text. Our server logs show the ACTUAL mismatch.

### ❌ Changing just part of the URI
If Google has `http://localhost:3000/api/google/callback` registered but your app sends `http://localhost:3001/api/google/callback` (different port), it will fail.

### ❌ Forgetting to save changes
Make sure you **click "Save"** after editing Google Cloud Console credentials.

### ❌ Using the wrong OAuth app
If you have multiple OAuth credentials, make sure you're editing the right one and using its `GOOGLE_CLIENT_ID`.

---

## Still Getting Error?

Check these things:

1. **Restart dev server** - Sometimes config isn't reloaded
2. **Verify exact match** - Copy-paste from logs, don't retype
3. **Check credentials** - Are `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` correct?
4. **Check environment** - Are you on `localhost:3000` or a different URL?
5. **Wait 5 minutes** - Google Cloud changes sometimes take a moment to propagate

---

## For Production

When deploying to production (e.g., `myapp.com`):

1. **Register your domain** in Google Cloud Console:
   ```
   https://myapp.com/api/google/callback
   ```

2. **Make sure your app uses** `https://` (not `http://`)

3. **Update environment variables** to use your domain
   ```
   APP_URL=https://www.nerve.watch
   ```

4. **Keep localhost redirect** for local development (optional):
   ```
   http://localhost:3000/api/google/callback
   https://localhost:3001/api/google/callback
   https://myapp.com/api/google/callback
   ```

---

## Getting Help

If this doesn't work:

1. Check if Google Client ID and Secret are correct
2. Verify the app is running on the expected URL
3. Look at the full server log output (not just browser error)
4. Make sure there are no typos in the redirect URI
