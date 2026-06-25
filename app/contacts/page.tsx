"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";
import AppLayout from "../components/AppLayout";
import ContactCard from "../components/ContactCard";
import { Search, ArrowUpDown } from "lucide-react";

interface ContactSummary {
  id: string;
  senderEmail: string;
  displayName: string | null;
  emailCount: number;
  importance: number;
  sentimentScore: number;
  sentiment: "positive" | "neutral" | "urgent";
  lastEmailAt: string;
  avgResponseTime: number | null;
  replyRate: number;
}

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useEmail();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessionSnapshot, setSessionSnapshot] = useState<{
    savedUser: string | null;
    savedProvider: string | null;
  }>({ savedUser: null, savedProvider: null });
  const mockContacts: ContactSummary[] = [
    {
      id: "mock-1",
      senderEmail: "alex.chen@acmecorp.com",
      displayName: "Alex Chen",
      emailCount: 24,
      importance: 8,
      sentimentScore: 0.85,
      sentiment: "positive",
      lastEmailAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      avgResponseTime: 45,
      replyRate: 92,
    },
    {
      id: "mock-2",
      senderEmail: "sarah.miller@startup.io",
      displayName: "Sarah Miller",
      emailCount: 18,
      importance: 7,
      sentimentScore: 0.72,
      sentiment: "positive",
      lastEmailAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      avgResponseTime: 120,
      replyRate: 78,
    },
    {
      id: "mock-3",
      senderEmail: "david.kim@design.co",
      displayName: "David Kim",
      emailCount: 12,
      importance: 5,
      sentimentScore: 0.5,
      sentiment: "neutral",
      lastEmailAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      avgResponseTime: 360,
      replyRate: 55,
    },
    {
      id: "mock-4",
      senderEmail: "priya.patel@financegroup.com",
      displayName: "Priya Patel",
      emailCount: 9,
      importance: 9,
      sentimentScore: 0.9,
      sentiment: "urgent",
      lastEmailAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      avgResponseTime: 20,
      replyRate: 98,
    },
    {
      id: "mock-5",
      senderEmail: "james.wilson@techcorp.io",
      displayName: "James Wilson",
      emailCount: 6,
      importance: 3,
      sentimentScore: 0.3,
      sentiment: "neutral",
      lastEmailAt: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
      avgResponseTime: null,
      replyRate: 33,
    },
  ];

  const [contacts, setContacts] = useState<ContactSummary[]>(mockContacts);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"emailCount" | "name" | "lastEmailAt">("emailCount");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = getSessionItem("emailUser");
    const savedProvider = getSessionItem("emailConnectionProvider");
    setSessionSnapshot({ savedUser, savedProvider });
    setHasHydrated(true);
    if (!savedUser) {
      router.replace("/login");
    } else if (!savedProvider) {
      router.replace("/connect");
    }
  }, [router]);

  const userEmail = user || sessionSnapshot.savedUser;

  const fetchContacts = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userEmail });
      if (search) params.set("search", search);
      params.set("sort", sort);
      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data.contacts.length > 0 ? data.contacts : mockContacts);
    } catch (err) {
      console.error("[ContactsPage] Error:", err);
      setContacts(mockContacts);
    } finally {
      setLoading(false);
    }
  }, [userEmail, search, sort]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const isLoading = !hasHydrated || !sessionSnapshot.savedUser || !sessionSnapshot.savedProvider;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <AppLayout>
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="text-2xl shrink-0">{String.fromCodePoint(0x1F91D)}</div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Contacts</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{user}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full md:w-80 lg:w-96 xl:w-[28rem] 2xl:w-[32rem] bg-white border-r border-gray-200 overflow-y-auto flex flex-col ${
            selectedId && "hidden md:flex md:flex-col"
          }`}
        >
          <div className="p-3 sm:p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
            <div>
              <h2 className="font-bold text-gray-900">All Contacts</h2>
              <p className="text-sm text-gray-600">{contacts.length} contacts</p>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-1.5">
              {[
                { key: "emailCount", label: "Most emails" },
                { key: "name", label: "Name" },
                { key: "lastEmailAt", label: "Recent" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key as typeof sort)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                    sort === opt.key
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <ArrowUpDown size={12} className="inline-block mr-1 -mt-0.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">No contacts found</p>
                <p className="text-sm mt-1">Contacts appear as you receive emails</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedId(contact.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                      selectedId === contact.id ? "bg-emerald-50 border-l-2 border-emerald-500" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700 shrink-0">
                      {(contact.displayName || contact.senderEmail).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.displayName || contact.senderEmail}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{contact.senderEmail}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {contact.emailCount} email{contact.emailCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {contact.importance >= 7 && (
                        <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
                          Hot
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {contact.replyRate}%
                      </span>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                      className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete contact"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedContact ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="md:hidden mb-4">
              <button
                onClick={() => setSelectedId(null)}
                className="text-blue-600 font-medium"
              >
                ← Back to Contacts
              </button>
            </div>
            <ContactCard
              metrics={{
                displayName: selectedContact.displayName || selectedContact.senderEmail,
                email: selectedContact.senderEmail,
                importance: selectedContact.importance,
                emailCount: selectedContact.emailCount,
                lastEmailAt: selectedContact.lastEmailAt,
                avgResponseTime: selectedContact.avgResponseTime ?? undefined,
                replyRate: selectedContact.replyRate,
                sentimentScore: selectedContact.sentiment,
              }}
            />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a contact to view details</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
