"use client";

import Image from "next/image";
import { useEmail } from "./providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { getSessionItem } from "@/lib/client-session";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useEmail();

  // Keep the landing page available for logged-out users and only resume the inbox for an active session.
  useEffect(() => {
    console.log("📄 PAGE: Home page loaded");
    console.log("📄 isLoggedIn:", isLoggedIn);
    console.log("📄 sessionStorage emailUser:", getSessionItem("emailUser"));

    if (isLoggedIn || getSessionItem("emailUser")) {
      console.log("✅ User already logged in, redirecting to /inbox from home page");
      router.replace("/inbox");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="min-h-screen overflow-hidden relative" style={{backgroundColor: "#f0ffea"}}>

      {/* Decorative Background Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large circle top-right */}
        <motion.div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-green-200/40"
          initial={{ opacity: 0, x: 100, y: -100 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ opacity: { duration: 1 }, x: { duration: 1.2 }, y: { duration: 1.2 }, scale: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.2 }, rotate: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.2 } }}
        />
        {/* Small circle top-left */}
        <motion.div
          className="absolute top-40 -left-16 w-48 h-48 rounded-full bg-emerald-200/50"
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0, y: [0, -20, 0] }}
          transition={{ opacity: { duration: 0.8, delay: 0.3 }, x: { duration: 1, delay: 0.3 }, y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.3 } }}
        />
        {/* Diamond shape mid-right */}
        <motion.div
          className="absolute top-[600px] -right-10 w-40 h-40 bg-green-300/30 rotate-45"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0, rotate: [45, 55, 45], scale: [1, 1.15, 1] }}
          transition={{ opacity: { duration: 0.8, delay: 0.5 }, x: { duration: 1, delay: 0.5 }, rotate: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }, scale: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
        />
        {/* Pill shape left */}
        <motion.div
          className="absolute top-[900px] -left-20 w-60 h-24 rounded-full bg-emerald-300/25"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: [0, 30, 0] }}
          transition={{ opacity: { duration: 0.8, delay: 0.7 }, x: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
        />
        {/* Large ring center-right */}
        <motion.div
          className="absolute top-[1300px] right-20 w-64 h-64 rounded-full border-[6px] border-green-300/30"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: [1, 1.08, 1], rotate: [0, -15, 0] }}
          transition={{ opacity: { duration: 1, delay: 0.9 }, scale: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }, rotate: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
        />
        {/* Small dot cluster */}
        <motion.div
          className="absolute top-[400px] left-[10%] w-6 h-6 rounded-full bg-green-400/40"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -15, 0] }}
          transition={{ opacity: { duration: 0.6, delay: 0.4 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
        />
        <motion.div
          className="absolute top-[430px] left-[12%] w-4 h-4 rounded-full bg-emerald-400/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{ opacity: { duration: 0.6, delay: 0.6 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 } }}
        />
        <motion.div
          className="absolute top-[415px] left-[14%] w-3 h-3 rounded-full bg-green-500/25"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: [0, -12, 0] }}
          transition={{ opacity: { duration: 0.6, delay: 0.8 }, y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.4 } }}
        />
        {/* Triangle shape bottom-left */}
        <motion.div
          className="absolute bottom-60 left-10 w-0 h-0"
          style={{ borderLeft: "50px solid transparent", borderRight: "50px solid transparent", borderBottom: "86px solid rgba(74,222,128,0.2)" }}
          initial={{ opacity: 0, x: -60, y: 40 }}
          animate={{ opacity: 1, x: 0, y: [0, -15, 0], rotate: [0, 20, 0] }}
          transition={{ opacity: { duration: 0.8, delay: 1 }, x: { duration: 1, delay: 1 }, y: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.8 }, rotate: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.8 } }}
        />
        {/* Rounded square bottom-right */}
        <motion.div
          className="absolute bottom-40 right-[15%] w-28 h-28 rounded-2xl bg-green-200/30 rotate-12"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0, rotate: [12, 25, 12] }}
          transition={{ opacity: { duration: 0.8, delay: 1.1 }, x: { duration: 1, delay: 1.1 }, rotate: { duration: 13, repeat: Infinity, ease: "easeInOut", delay: 1.8 } }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            className="relative w-[150px] h-[150px] mx-auto mb-8"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/MailTurtleLogo.png"
              alt="mailturtle logo"
              fill
              sizes="150px"
              className="object-contain"
            />
          </motion.div>
          <motion.h1
            className="text-[150px] font-bold text-green-700 drop-shadow-lg leading-none mb-4"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            MailTurtle
          </motion.h1>
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            AI-Powered Email Intelligence
          </motion.h2>
          <motion.p
            className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            Smart email classification powered by advanced AI. Organize, categorize, and understand your inbox like never before.
          </motion.p>
          <motion.a
            href="/login"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-10 rounded-lg transition"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started Now
          </motion.a>
        </motion.div>

        {/* How AI Works */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div className="bg-white/60 backdrop-blur border border-green-200 rounded-xl p-8 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">AI Analysis</h3>
            <p className="text-slate-700">
              Our AI powered by OpenAI&apos;s GPT models automatically analyzes your emails and categorizes them into Work, Personal, Promotions, Alerts, and Other categories in real-time.
            </p>
          </motion.div>

          <motion.div className="bg-white/60 backdrop-blur border border-green-200 rounded-xl p-8 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Customizable Logic</h3>
            <p className="text-slate-700">
              Fine-tune how the AI checks your emails. Create rules for specific domains, keywords, or senders. The AI learns your preferences and adapts to your unique email patterns.
            </p>
          </motion.div>

          <motion.div className="bg-white/60 backdrop-blur border border-green-200 rounded-xl p-8 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Summaries</h3>
            <p className="text-slate-700">
              Get instant summaries of each email. The AI extracts key information and provides concise overviews so you can quickly understand what matters.
            </p>
          </motion.div>
        </motion.div>

        {/* Google Integration */}
        <motion.div
          className="bg-white/50 backdrop-blur border border-green-200 rounded-xl p-12 mb-16 shadow-sm relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          {/* Decorative shape inside card */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-green-200/30" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-200/20" />
          <div className="grid md:grid-cols-2 gap-12 items-center relative">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Secure Google Integration</h2>
              <p className="text-slate-700 mb-4">
                mailturtle integrates securely with Google using OAuth 2.0 authentication. This means:
              </p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 font-bold">✓</span>
                  <span>Your passwords are never stored - we use secure OAuth tokens</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 font-bold">✓</span>
                  <span>You control what permissions the app has access to</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 font-bold">✓</span>
                  <span>You can revoke access at any time through Google settings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-3 font-bold">✓</span>
                  <span>All connections are encrypted with industry-standard security</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center shadow-inner">
                <svg className="w-20 h-20 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Guidelines & Privacy */}
        <motion.div
          className="grid md:grid-cols-2 gap-8 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div className="bg-white/50 backdrop-blur border border-green-200 rounded-xl p-8 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">AI Guidelines</h2>
            <p className="text-slate-700 mb-4">
              We follow strict guidelines for AI email analysis:
            </p>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li>• AI only accesses email subject, preview, and body for analysis</li>
              <li>• Processing happens securely and is never logged long-term</li>
              <li>• AI models are regularly audited for bias and accuracy</li>
              <li>• Sensitive information is never used for model training</li>
              <li>• All analysis respects user privacy and data protection laws</li>
            </ul>
          </motion.div>

          <motion.div className="bg-white/50 backdrop-blur border border-green-200 rounded-xl p-8 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Usage</h2>
            <p className="text-slate-700 mb-4">
              How we use your information to improve:
            </p>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li>• Anonymized email patterns help improve category accuracy</li>
              <li>• Performance metrics identify problematic email types</li>
              <li>• User feedback trains better categorization models</li>
              <li>• Personal data is never shared with third parties</li>
              <li>• You can opt-out of data collection at any time</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* What Gets Analyzed */}
        <motion.div
          className="bg-gradient-to-r from-green-200/50 to-emerald-200/50 border border-green-300/60 rounded-xl p-12 mb-16 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-4 right-8 w-20 h-20 rounded-full border-4 border-green-300/30" />
          <div className="absolute bottom-4 left-8 w-12 h-12 bg-emerald-300/20 rotate-45" />
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center relative">What Your AI Analyzes</h2>
          <div className="grid md:grid-cols-5 gap-6 text-center relative">
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <p className="text-slate-900 font-semibold">Subject Line</p>
              <p className="text-slate-700 text-sm mt-1">Email topic and urgency indicators</p>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <p className="text-slate-900 font-semibold">Preview Text</p>
              <p className="text-slate-700 text-sm mt-1">Context and summary info</p>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <p className="text-slate-900 font-semibold">Body Content</p>
              <p className="text-slate-700 text-sm mt-1">Full message for deep analysis</p>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h.008v.008H6V6z" /></svg>
              </div>
              <p className="text-slate-900 font-semibold">Categories</p>
              <p className="text-slate-700 text-sm mt-1">Work, Personal, Promotions, Alerts</p>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
              </div>
              <p className="text-slate-900 font-semibold">Summaries</p>
              <p className="text-slate-700 text-sm mt-1">Key points extracted automatically</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2 className="text-3xl font-bold text-slate-900 mb-8 text-center" variants={fadeUp} transition={{ duration: 0.5 }}>Key Features</motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div className="bg-white/50 border border-green-200 rounded-xl p-6 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Progressive Web App</h3>
              <p className="text-slate-700">Works offline and can be installed on any device like a native app</p>
            </motion.div>
            <motion.div className="bg-white/50 border border-green-200 rounded-xl p-6 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Analysis</h3>
              <p className="text-slate-700">Emails are automatically analyzed and categorized as they arrive</p>
            </motion.div>
            <motion.div className="bg-white/50 border border-green-200 rounded-xl p-6 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Rules</h3>
              <p className="text-slate-700">Create your own rules to guide AI classification for specific scenarios</p>
            </motion.div>
            <motion.div className="bg-white/50 border border-green-200 rounded-xl p-6 shadow-sm" variants={fadeUp} transition={{ duration: 0.5 }}>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Privacy First</h3>
              <p className="text-slate-700">Your data stays yours - we don&apos;t sell or misuse your information</p>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Transform Your Email?</h2>
          <p className="text-slate-700 mb-8">Join thousands of users who are already organizing their inbox with AI</p>
          <motion.a
            href="/login"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-12 rounded-lg transition text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Start For Free
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}
