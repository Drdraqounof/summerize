"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useEmail();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("LOGIN PAGE LOADED - Component mounted");
  }, []);

  const handleAuth = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await register(email, password, name.trim());
        router.replace("/questions");
      } else {
        const result = await login(email, password);

        if (result.hasCompletedOnboarding && result.onboardingAnswers) {
          router.replace("/connect");
          return;
        }

        router.replace("/questions");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f0ffea] px-4 py-16">
      <button
        onClick={() => router.back()}
        className="mb-8 inline-flex items-center gap-2 text-slate-600 hover:text-green-700 transition font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <div className="mx-auto grid w-full max-w-6xl gap-6 sm:gap-8 lg:gap-10 px-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-green-200 bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 p-6 sm:p-8 lg:p-10 text-white shadow-2xl shadow-green-200">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-lime-200/20" />
          <p className="mb-4 inline-flex rounded-full border border-white/20 px-4 py-1 text-sm font-semibold text-green-50/90">
            mailturtle setup
          </p>
          <h1 className="max-w-xl text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Connect your inbox to smarter triage and summaries.
          </h1>
          <p className="mt-3 sm:mt-4 max-w-xl text-sm sm:text-base leading-6 sm:leading-7 text-green-50/85">
            Sign in first, answer four quick setup questions, and returning users go straight into Google inbox connection.
          </p>
          <div className="mt-8 sm:mt-10 grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-green-50/80">Step 1</p>
              <p className="mt-2 text-base sm:text-lg font-semibold">Quick onboarding</p>
              <p className="mt-2 text-xs sm:text-sm text-green-50/80">
                Tell us if you have used AI before, which emails matter, and how you want help.
              </p>
            </div>
            <div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/15 bg-white/10 p-4 sm:p-5 backdrop-blur">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-green-50/80">Step 2</p>
              <p className="mt-2 text-base sm:text-lg font-semibold">Connect Gmail</p>
              <p className="mt-2 text-xs sm:text-sm text-green-50/80">
                Google OAuth starts right away once your setup is complete.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-green-200 bg-white/85 p-6 sm:p-8 lg:p-10 shadow-xl shadow-green-100 backdrop-blur">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 sm:h-16 w-12 sm:w-16 items-center justify-center rounded-2xl bg-green-100 text-2xl sm:text-3xl text-green-700 shadow-inner shadow-green-200">
              M
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              {mode === "signin"
                ? "Sign in to start your mailturtle onboarding flow."
                : "Create an account and save your login in the database."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-full bg-green-100 p-1 text-xs sm:text-sm font-semibold text-green-900">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`rounded-full px-2 sm:px-4 py-1.5 sm:py-2 transition ${
                mode === "signin" ? "bg-white shadow text-slate-900" : "text-green-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`rounded-full px-2 sm:px-4 py-1.5 sm:py-2 transition ${
                mode === "signup" ? "bg-white shadow text-slate-900" : "text-green-800"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="space-y-5">
            {mode === "signup" ? (
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-2xl border border-green-200 bg-green-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-green-200 bg-green-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-green-200 bg-green-50/50 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <button
              type="button"
              onClick={handleAuth}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            {mode === "signin" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Built for real account creation, guided onboarding, and AI inbox triage.
          </p>
        </div>
      </div>
    </div>
  );
}
