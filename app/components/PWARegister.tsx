"use client";

import { useEffect, useRef } from "react";

/**
 * PWARegister Component
 * 
 * Handles Progressive Web App (PWA) service worker registration with multiple
 * failsafe measures to prevent breaking the application:
 * 
 * - Offline detection: Won't register if user is offline
 * - File existence check: Verifies sw.js exists before registration
 * - Single registration: Prevents duplicate registrations
 * - Safe updates: Notifies about updates without auto-reloading
 * - Online/offline monitoring: Tracks connectivity state
 */
export default function PWARegister() {
  // Track if registration has already been attempted to prevent duplicates
  const registrationAttempted = useRef(false);

  useEffect(() => {
    // FAILSAFE #1: Prevent multiple registration attempts
    // Only allow one registration per component mount
    if (registrationAttempted.current) return;
    // Only run in browser environment where navigator is available
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // next-pwa does not reliably emit sw.js during local dev, so skip registration there.
    if (process.env.NODE_ENV !== "production") {
      console.info("[PWA] Skipping service worker registration outside production");
      registrationAttempted.current = true;
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // FAILSAFE #2: Don't register if user is offline
        // Prevents broken service worker installations when offline
        if (!navigator.onLine) {
          console.warn("[PWA] Network offline, skipping service worker registration");
          return;
        }

        // FAILSAFE #3: Check if sw.js file actually exists
        // Prevents 404 errors from being cached by the browser
        const swResponse = await fetch("/sw.js", { method: "HEAD" });
        if (!swResponse.ok) {
          console.warn(`[PWA] Service worker file not found (${swResponse.status})`);
          return;
        }

        // Register the service worker with the browser
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          // FAILSAFE #4: updateViaCache: "none" prevents aggressive cache updates
          // Ensures we always get the latest service worker code
          updateViaCache: "none",
        });

        console.log("[PWA] Service worker registered successfully:", registration.scope);

        // FAILSAFE #5: Handle service worker updates safely
        // When a new service worker is available, notify but don't auto-reload
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // New service worker is installed and waiting to become active
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Log that update is available but don't reload the page
                // This prevents losing user's work due to unexpected refresh
                console.log("[PWA] Service worker update available");
                // Could emit event or show UI notification to user instead
              }
            });
          }
        });
      } catch (error) {
        // FAILSAFE #6: Catch registration errors without crashing the app
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[PWA] Registration failed:", errorMsg);
        // Don't throw - app continues working even if PWA registration fails
      }
    };

    // Register on window load event (waits for DOM to be ready)
    window.addEventListener("load", async () => {
      registrationAttempted.current = true;
      await registerServiceWorker();
    });

    // FAILSAFE #7: Monitor online/offline state
    // Helps debug connectivity issues and track app network status
    const handleOnline = () => {
      console.log("[PWA] Back online");
      // Could attempt SW registration retry here if needed
    };
    const handleOffline = () => {
      console.warn("[PWA] Offline detected");
    };

    // Attach event listeners for online/offline state changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup: Remove event listeners when component unmounts
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
