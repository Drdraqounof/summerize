"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useEmail();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("LOGIN PAGE LOADED - Component mounted");
  }, []);

  const handleSignIn = () => {
    console.log("===== BUTTON CLICKED =====");
    console.log("Email field value:", email);
    console.log("Password field value:", password);
    console.log("Loading state:", loading);

    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    login(email, password);
    router.replace("/questions");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f0ffea] px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative overflow-hidden rounded-[2rem] border border-green-200 bg-gradient-to-br from-green-900 via-emerald-800 to-green-700 p-8 text-white shadow-2xl shadow-green-200 sm:p-10">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-lime-200/20" />
          <p className="mb-4 inline-flex rounded-full border border-white/20 px-4 py-1 text-sm font-semibold text-green-50/90">
            mailturtle setup
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            Connect your inbox to smarter triage and summaries.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-green-50/85">
            Sign in first, answer two short onboarding questions, then choose which mailbox provider you want to connect.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-50/80">Step 1</p>
              <p className="mt-2 text-lg font-semibold">Quick onboarding</p>
              <p className="mt-2 text-sm text-green-50/80">
                Tell us why you are here and how familiar you are with tools like this.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-50/80">Step 2</p>
              <p className="mt-2 text-lg font-semibold">Choose your provider</p>
              <p className="mt-2 text-sm text-green-50/80">
                Use Google OAuth for Gmail now, or select another provider for the next phase.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-green-200 bg-white/85 p-8 shadow-xl shadow-green-100 backdrop-blur sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-700 shadow-inner shadow-green-200">
              M
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-600">Sign in to start your mailturtle onboarding flow.</p>
          </div>

          <div className="space-y-5">
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
              onClick={handleSignIn}
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-green-200 bg-green-50 p-4 text-sm text-slate-700">
            <p className="mb-2 font-semibold">Demo Credentials</p>
            <p>Email: demo@example.com</p>
            <p>Password: demo123</p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Built for fast onboarding, guided connection, and AI inbox triage.
          </p>
        </div>
      </div>
    </div>
  );
}
