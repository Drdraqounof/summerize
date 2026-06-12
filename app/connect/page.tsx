"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";

const providerOptions = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect a Google account and sync your Gmail inbox.",
  },
];

function ConnectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isLoggedIn,
    onboardingAnswers,
    connectionProvider,
    connectedAccount,
    saveConnectionProvider,
    saveConnectedAccount,
  } = useEmail();
  const [selectedProvider, setSelectedProvider] = useState(connectionProvider ?? "gmail");
  const [statusMessage, setStatusMessage] = useState("");
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);
  const googleStatus = searchParams.get("google");
  const connectedEmail = searchParams.get("email");
  const connectedName = searchParams.get("name");
  const oauthStatusMessage = googleStatus === "connected" && connectedEmail
    ? `Connected Gmail account: ${connectedEmail}`
    : googleStatus && googleStatus !== "connected"
      ? "Google connection was not completed. Try again."
      : "";

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");

    if (!isLoggedIn && !savedUser) {
      router.replace("/login");
      return;
    }

    if (!onboardingAnswers && !getSessionItem("onboardingAnswers")) {
      router.replace("/questions");
    }
  }, [isLoggedIn, onboardingAnswers, router]);

  useEffect(() => {
    if (googleStatus === "connected" && connectedEmail) {
      const nextParams = new URLSearchParams({
        google: "connected",
        email: connectedEmail,
      });

      if (connectedName) {
        nextParams.set("name", connectedName);
      }

      router.replace(`/connect/complete?${nextParams.toString()}`);
      return;
    }
  }, [connectedEmail, connectedName, googleStatus, router, saveConnectedAccount]);

  const handleContinue = () => {
    saveConnectionProvider(selectedProvider);
    router.push("/inbox");
  };

  const handleConnect = () => {
    setShowGoogleWarning(true);
  };

  return (
    <>
      <div className="min-h-screen bg-[#f0ffea] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] sm:rounded-[2rem] border border-green-200 bg-white/80 p-6 sm:p-8 lg:p-10 shadow-xl shadow-green-100 backdrop-blur">
        <div className="mb-8 sm:mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 sm:mb-3 inline-flex rounded-full bg-green-100 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold text-green-800">
              Step 3 of 3
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Choose which email account to connect</h1>
            <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-slate-700">
              Connect your Gmail account to sync your inbox.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/questions")}
            className="inline-flex items-center justify-center rounded-full border border-green-300 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-green-800 transition hover:bg-green-50 whitespace-nowrap"
          >
            Back to Questions
          </button>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {providerOptions.map((provider) => {
            const isSelected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                className={`rounded-[1.25rem] sm:rounded-[1.5rem] border p-4 sm:p-6 text-left transition ${
                  isSelected
                    ? "border-green-600 bg-green-100 shadow-lg shadow-green-100"
                    : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">{provider.name}</h2>
                  <span
                    className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap ${
                      isSelected ? "bg-green-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isSelected ? "Selected" : "Available"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-slate-700">{provider.description}</p>
              </button>
            );
          })}
        </div>

        {oauthStatusMessage || statusMessage ? (
          <div className="mt-6 rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-white px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-700">
            {oauthStatusMessage || statusMessage}
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-4 rounded-[1.5rem] border border-green-200 bg-green-50/70 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Current choice: {providerOptions.find((provider) => provider.id === selectedProvider)?.name}</p>
            <p className="mt-1 text-sm text-slate-700">
              {connectedAccount?.provider === selectedProvider
                ? `Connected account: ${connectedAccount.email}`
                : "Connect the provider, then continue into the inbox experience."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleConnect}
              className="inline-flex items-center justify-center rounded-full border border-green-400 bg-white px-8 py-3 font-semibold text-green-800 transition hover:bg-green-50"
            >
              Connect with Google
            </button>
            {/* Dev helper: allow manually setting a connected email for testing when OAuth is restricted */}
            {process.env.NODE_ENV !== "production" ? (
              <button
                type="button"
                onClick={() => {
                  const testEmail = window.prompt("Enter test email to simulate Google connection (dev only):");
                  if (testEmail) {
                    saveConnectedAccount({ provider: "gmail", email: testEmail, name: undefined });
                    router.replace('/connect');
                  }
                }}
                className="inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Use Test Email
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700"
            >
              Continue to Inbox
            </button>
          </div>
        </div>
      </div>
      </div>

      {showGoogleWarning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-amber-200 bg-white p-7 shadow-2xl shadow-slate-900/15 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              Before you continue
            </p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Google may show an unverified-app warning
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              Google may show an unverified-app warning due to this being in the beta stage.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              This screen is controlled by Google. If it appears, use the Google flow to continue or return here if you do not want to proceed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleWarning(false)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleWarning(false);
                  window.location.href = "/api/google/auth";
                }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700"
              >
                Continue to Google
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectPageContent />
    </Suspense>
  );
}