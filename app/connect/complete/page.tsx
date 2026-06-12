"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSessionItem } from "@/lib/client-session";
import { useEmail } from "@/app/providers";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const loadingSteps = [
  "Loading emails",
  "Syncing your inbox",
  "Fetching labels",
  "Organizing messages",
];

export default function ConnectCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, onboardingAnswers, saveConnectedAccount } = useEmail();
  const [activeStep, setActiveStep] = useState(0);
  const hasSavedAccount = useRef(false);

  const googleStatus = searchParams.get("google");
  const connectedEmail = searchParams.get("email");
  const connectedName = searchParams.get("name");

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");

    if (!isLoggedIn && !savedUser) {
      router.replace("/login");
      return;
    }

    if (!onboardingAnswers && !getSessionItem("onboardingAnswers")) {
      router.replace("/questions");
      return;
    }

    if (googleStatus !== "connected" || !connectedEmail) {
      router.replace("/connect");
    }
  }, [connectedEmail, googleStatus, isLoggedIn, onboardingAnswers, router]);

  useEffect(() => {
    if (!connectedEmail || hasSavedAccount.current) {
      return;
    }

    hasSavedAccount.current = true;
    saveConnectedAccount({
      provider: "gmail",
      email: connectedEmail,
      name: connectedName ?? undefined,
    });
  }, [connectedEmail, connectedName, saveConnectedAccount]);

  useEffect(() => {
    if (googleStatus !== "connected" || !connectedEmail) {
      return;
    }

    const stepTimer = window.setInterval(() => {
      setActiveStep((currentStep) => {
        if (currentStep >= loadingSteps.length - 1) {
          window.clearInterval(stepTimer);
          return currentStep;
        }

        return currentStep + 1;
      });
    }, 850);

    const navigationTimer = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 3600);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(navigationTimer);
    };
  }, [connectedEmail, googleStatus, router]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f0ffea] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="relative w-full overflow-hidden rounded-[2rem] border border-green-200 bg-white/85 p-8 shadow-2xl shadow-green-100 backdrop-blur sm:p-10 lg:p-12"
        >
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-green-100/80" />
          <div className="absolute bottom-0 left-0 h-36 w-36 -translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-100/80" />

          <div className="relative">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl"
            >
              ✓
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mt-6 inline-flex rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-800"
            >
              Connection complete
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl"
            >
              Gmail connected
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-3 max-w-2xl text-base leading-7 text-slate-700"
            >
              Your Gmail account is now connected. We&apos;re pulling in your inbox so the app opens with your latest messages ready.
            </motion.p>

            {connectedEmail ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="mt-6 rounded-[1.5rem] border border-green-200 bg-green-50/80 px-5 py-4"
              >
                <p className="text-sm font-semibold text-slate-900">Connected account</p>
                <p className="mt-1 text-sm text-slate-700">{connectedEmail}</p>
              </motion.div>
            ) : null}

            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Inbox setup
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {loadingSteps.map((step, index) => {
                  const isComplete = index < activeStep;
                  const isActive = index === activeStep;

                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.3 + index * 0.08 }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                        isActive
                          ? "border-green-300 bg-white text-slate-900 shadow-sm"
                          : isComplete
                            ? "border-green-200 bg-green-50 text-green-900"
                            : "border-slate-200 bg-slate-100/70 text-slate-500"
                      }`}
                    >
                      <span className="text-sm font-medium">{step}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                        {isComplete ? "Done" : isActive ? "Now" : "Next"}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-6 text-sm text-slate-500"
            >
              You&apos;ll be forwarded to your inbox automatically.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}