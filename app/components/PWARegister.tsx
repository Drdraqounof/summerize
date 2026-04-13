"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          // Service worker registration disabled temporarily for troubleshooting
          // const registration = await navigator.serviceWorker.register("/sw.js", {
          //   scope: "/",
          // });
          // console.log("PWA registered successfully:", registration);
        } catch (error) {
          console.log("PWA registration failed:", error);
        }
      });
    }
  }, []);

  return null;
}
