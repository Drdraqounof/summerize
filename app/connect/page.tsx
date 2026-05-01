"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEmail } from "../providers";

const providerOptions = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect a Google account and sync your Gmail inbox.",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Use a Microsoft inbox for work or personal email.",
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    description: "Bring in a Yahoo mailbox for AI sorting and summaries.",
  },
  {
    id: "imap",
    name: "Other IMAP",
    description: "Choose a custom provider if your mailbox supports IMAP.",
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
  const googleStatus = searchParams.get("google");
  const connectedEmail = searchParams.get("email");
  const connectedName = searchParams.get("name");
  const oauthStatusMessage = googleStatus === "connected" && connectedEmail
    ? `Connected Gmail account: ${connectedEmail}`
    : googleStatus && googleStatus !== "connected"
      ? "Google connection was not completed. Try again."
      : "";

  useEffect(() => {
    const savedUser = localStorage.getItem("emailUser");

    if (!isLoggedIn && !savedUser) {
      router.replace("/login");
      return;
    }

    if (!onboardingAnswers && !localStorage.getItem("onboardingAnswers")) {
      router.replace("/questions");
    }
  }, [isLoggedIn, onboardingAnswers, router]);

  useEffect(() => {
    if (googleStatus === "connected" && connectedEmail) {
      saveConnectedAccount({
        provider: "gmail",
        email: connectedEmail,
        name: connectedName ?? undefined,
      });
      router.replace("/connect");
      return;
    }
  }, [connectedEmail, connectedName, googleStatus, router, saveConnectedAccount]);

  const handleContinue = () => {
    saveConnectionProvider(selectedProvider);
    router.push("/inbox");
  };

  const handleConnect = () => {
    if (selectedProvider === "gmail") {
      window.location.href = "/api/google/auth";
      return;
    }

    saveConnectionProvider(selectedProvider);
    setStatusMessage(`Selected ${providerOptions.find((provider) => provider.id === selectedProvider)?.name}. Live OAuth is currently wired for Gmail.`);
  };

  return (
    <div className="min-h-screen bg-[#f0ffea] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-green-200 bg-white/80 p-8 shadow-xl shadow-green-100 backdrop-blur sm:p-10">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
              Step 2 of 2
            </p>
            <h1 className="text-4xl font-bold text-slate-900">Choose which email account to connect</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-700">
              Pick the mailbox provider you want mailturtle to work with first. You can expand this flow with live OAuth wiring next.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/questions")}
            className="inline-flex items-center justify-center rounded-full border border-green-300 px-6 py-3 font-semibold text-green-800 transition hover:bg-green-50"
          >
            Back to Questions
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {providerOptions.map((provider) => {
            const isSelected = selectedProvider === provider.id;

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => setSelectedProvider(provider.id)}
                className={`rounded-[1.5rem] border p-6 text-left transition ${
                  isSelected
                    ? "border-green-600 bg-green-100 shadow-lg shadow-green-100"
                    : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">{provider.name}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isSelected ? "bg-green-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isSelected ? "Selected" : "Available"}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-700">{provider.description}</p>
              </button>
            );
          })}
        </div>

        {oauthStatusMessage || statusMessage ? (
          <div className="mt-6 rounded-[1.5rem] border border-green-200 bg-white px-5 py-4 text-sm text-slate-700">
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
              {selectedProvider === "gmail" ? "Connect with Google" : "Save Provider"}
            </button>
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
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectPageContent />
    </Suspense>
  );
}