"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";
import { focusAreaOptions } from "@/lib/onboarding";

const experienceOptions = [
  { value: "first-time", label: "This is my first time using a tool like this" },
  { value: "a-few-times", label: "I have used similar apps a few times" },
  { value: "regular-user", label: "I use email productivity tools regularly" },
];

export default function QuestionsPage() {
  const router = useRouter();
  const { isLoggedIn, onboardingAnswers, saveOnboardingAnswers } = useEmail();
  const [reason, setReason] = useState(onboardingAnswers?.reason ?? "");
  const [hasUsedSimilarApps, setHasUsedSimilarApps] = useState(
    onboardingAnswers?.hasUsedSimilarApps ?? ""
  );
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(
    onboardingAnswers?.selectedFocusAreas ?? []
  );
  const [customFocus, setCustomFocus] = useState(onboardingAnswers?.customFocus ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem("emailUser")) {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  const toggleFocusArea = (focusId: string) => {
    setSelectedFocusAreas((current) =>
      current.includes(focusId)
        ? current.filter((value) => value !== focusId)
        : [...current, focusId]
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Tell us why you are using mailturtle today.");
      return;
    }

    if (!hasUsedSimilarApps) {
      setError("Choose whether you have used apps like this before.");
      return;
    }

    if (selectedFocusAreas.length === 0 && !customFocus.trim()) {
      setError("Pick at least one email type to watch, or describe one in your own words.");
      return;
    }

    saveOnboardingAnswers({
      reason: reason.trim(),
      hasUsedSimilarApps,
      selectedFocusAreas,
      customFocus: customFocus.trim(),
    });

    router.push("/connect");
  };

  return (
    <div className="min-h-screen bg-[#f0ffea] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-green-200 bg-white/80 p-8 shadow-xl shadow-green-100 backdrop-blur sm:p-10">
        <div className="mb-8">
          <p className="mb-3 inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
            Step 1 of 2
          </p>
          <h1 className="text-4xl font-bold text-slate-900">Tell us which emails the AI should watch for</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-700">
            Choose the topics that matter to you and mailturtle will flag matching emails after you connect your inbox.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-green-200 bg-green-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">Watchlist</p>
            <p className="mt-2 text-sm text-slate-700">Pick the kinds of emails that deserve a heads-up instead of getting buried in the inbox.</p>
          </div>
          <div className="rounded-[1.5rem] border border-green-200 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">AI matching</p>
            <p className="mt-2 text-sm text-slate-700">Shopping picks up grocery deals, promotions, coupons, and other store-related emails automatically.</p>
          </div>
          <div className="rounded-[1.5rem] border border-green-200 bg-green-50/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">Less noise</p>
            <p className="mt-2 text-sm text-slate-700">The app still analyzes all emails, but only preference matches get the extra notification badge.</p>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reason" className="mb-3 block text-lg font-semibold text-slate-900">
              What should the AI help you stay on top of?
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Examples: keep grocery promotions visible, surface school reminders, catch travel updates before they are missed"
              className="min-h-36 w-full rounded-2xl border border-green-200 bg-green-50/50 px-4 py-4 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
            />
          </div>

          <fieldset>
            <legend className="mb-3 block text-lg font-semibold text-slate-900">
              Which emails should trigger extra attention?
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              {focusAreaOptions.map((option) => {
                const selected = selectedFocusAreas.includes(option.id);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleFocusArea(option.id)}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                      selected
                        ? "border-green-600 bg-green-100 shadow-sm"
                        : "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
                      {option.question}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{option.label}</h2>
                    <p className="mt-2 text-sm text-slate-700">{option.description}</p>
                    <p className="mt-3 text-xs text-slate-500">Looks for: {option.signals.join(", ")}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="customFocus" className="mb-3 block text-lg font-semibold text-slate-900">
              Anything else the AI should watch for?
            </label>
            <input
              id="customFocus"
              value={customFocus}
              onChange={(event) => setCustomFocus(event.target.value)}
              placeholder="Examples: job offers, package delays, soccer team updates"
              className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </div>

          <fieldset>
            <legend className="mb-3 block text-lg font-semibold text-slate-900">
              Have you used apps like this before?
            </legend>
            <div className="grid gap-3">
              {experienceOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                    hasUsedSimilarApps === option.value
                      ? "border-green-600 bg-green-100 text-slate-900"
                      : "border-green-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="experience"
                    value={option.value}
                    checked={hasUsedSimilarApps === option.value}
                    onChange={(event) => setHasUsedSimilarApps(event.target.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Next, you will connect an inbox so these rules can be used during analysis.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700"
            >
              Continue to Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}