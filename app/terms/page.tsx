import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Summerize",
  description: "Terms of service for Summerize and its email productivity platform.",
};

const sections = [
  {
    title: "Using the service",
    body: "By using Summerize, you agree to use the service lawfully, protect your account credentials, and avoid any activity that disrupts the platform or other users.",
  },
  {
    title: "Connected accounts",
    body: "If you connect a Gmail account, you authorize Summerize to access the Google data required to provide the features you enable, subject to your Google permissions.",
  },
  {
    title: "Availability",
    body: "We may update, suspend, or improve features at any time. We aim to keep the service available, but uptime and uninterrupted access are not guaranteed.",
  },
  {
    title: "User responsibility",
    body: "You remain responsible for the content in your connected accounts, the accuracy of information you provide, and the decisions you make based on summaries or recommendations.",
  },
  {
    title: "Termination",
    body: "We may suspend or terminate access if the service is abused, legal requirements demand it, or continued access creates security or operational risk.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact roanejuju14@gmail.com.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7fbf5] px-6 py-16 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Summerize
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            These terms describe the basic rules for using Summerize and connecting your email accounts to the platform.
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
          <Link href="/privacy" className="font-medium text-emerald-700 hover:text-emerald-800">
            Privacy Policy
          </Link>
          <span>Last updated: May 14, 2026</span>
        </div>
      </div>
    </main>
  );
}