import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Summerize",
  description: "Privacy policy for Summerize and its Gmail-connected email productivity features.",
};

const sections = [
  {
    title: "Information we collect",
    body: "Summerize stores the account details, onboarding preferences, and email metadata needed to authenticate users, connect Gmail, and display summaries inside the app.",
  },
  {
    title: "How we use information",
    body: "We use the information you provide to sign you in, retrieve Gmail messages you request, generate inbox summaries, and improve the organization features you enable.",
  },
  {
    title: "Google user data",
    body: "If you connect Gmail, Summerize accesses only the Google data required for the product experience you authorize. We do not sell Google user data or use it for advertising.",
  },
  {
    title: "Data sharing",
    body: "We share data only with service providers needed to operate the app, comply with legal obligations, or protect the security of users and the platform.",
  },
  {
    title: "Data retention",
    body: "We retain account and app data only for as long as it is needed to provide the service, satisfy legal obligations, and resolve security or support issues.",
  },
  {
    title: "Contact",
    body: "For privacy questions or data requests, contact roanejuju14@gmail.com.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7fbf5] px-6 py-16 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Summerize
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            This policy explains how Summerize collects, uses, and protects information when you use the website and connect a Gmail account.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-base leading-7 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <Link href="/" className="font-medium text-emerald-700 hover:text-emerald-800">
            Home
          </Link>
          <Link href="/terms" className="font-medium text-emerald-700 hover:text-emerald-800">
            Terms of Service
          </Link>
          <span>Last updated: May 14, 2026</span>
        </div>
      </div>
    </main>
  );
}