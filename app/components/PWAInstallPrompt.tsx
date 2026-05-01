"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PWAInstallPrompt() {
  const handleInstall = async () => {
    const event = window.deferredPrompt;
    if (event) {
      await event.prompt();
      const { outcome } = await event.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      window.deferredPrompt = null;
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      window.deferredPrompt = installEvent;
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
      <p className="text-blue-900 font-medium mb-2">Install Email Checker</p>
      <p className="text-blue-800 text-sm mb-3">
        Install this app on your device for offline access and a native app experience.
      </p>
      <button
        onClick={handleInstall}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
      >
        Install App
      </button>
    </div>
  );
}
