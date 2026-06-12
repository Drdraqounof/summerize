"use client";

import { useEffect, useState } from "react";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";
import { focusAreaOptions } from "@/lib/onboarding";

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  createdAt: string;
  isFocusArea?: boolean;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
}

const CATEGORIES = Array.from(
  new Set([
    "Work",
    "Personal",
    "Promotions",
    "Alerts",
    "Other",
    ...focusAreaOptions.map((f) => f.label),
  ])
);

const TEMPLATE_CONFIG: Record<
  string,
  {
    fields: Array<{
      key: string;
      label: string;
      placeholder: string;
      type: "emails" | "keywords" | "category";
    }>;
  }
> = {
  vip_contacts: {
    fields: [
      {
        key: "senders",
        label: "Email addresses or domains",
        placeholder: "e.g. boss@company.com, @client.com",
        type: "emails",
      },
    ],
  },
  newsletters: {
    fields: [
      {
        key: "category",
        label: "Assign category",
        placeholder: "",
        type: "category",
      },
    ],
  },
  sales_alerts: {
    fields: [
      {
        key: "senders",
        label: "Sender emails or domains",
        placeholder: "e.g. @sales.com",
        type: "emails",
      },
      {
        key: "keywords",
        label: "Keywords to watch for",
        placeholder: "e.g. lead, deal, opportunity",
        type: "keywords",
      },
    ],
  },
  project_based: {
    fields: [
      {
        key: "keywords",
        label: "Project keywords in subject",
        placeholder: "e.g. project, sprint, milestone",
        type: "keywords",
      },
      {
        key: "category",
        label: "Assign category",
        placeholder: "",
        type: "category",
      },
    ],
  },
};

function TemplateModal({
  template,
  onClose,
  onApply,
}: {
  template: RuleTemplate;
  onClose: () => void;
  onApply: (conditions: Record<string, unknown>, actions: Record<string, unknown>) => void;
}) {
  const config = TEMPLATE_CONFIG[template.id];
  const [values, setValues] = useState<Record<string, string>>({});

  if (!config) {
    onApply(template.conditions, template.actions);
    return null;
  }

  const handleApply = () => {
    const conditions = { ...template.conditions } as Record<string, unknown>;
    const actions = { ...template.actions } as Record<string, unknown>;

    for (const field of config.fields) {
      if (field.type === "emails") {
        const list = (values[field.key] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length > 0) conditions[field.key] = list;
      } else if (field.type === "keywords") {
        const list = (values[field.key] || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (list.length > 0) conditions[field.key] = list;
      } else if (field.type === "category" && values[field.key]) {
        actions.category = values[field.key];
      }
    }

    onApply(conditions, actions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{template.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{template.description}</p>

        <div className="space-y-4">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {field.type === "category" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomRuleModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, conditions: Record<string, unknown>, actions: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState("");
  const [senders, setSenders] = useState("");
  const [keywords, setKeywords] = useState("");
  const [subjects, setSubjects] = useState("");
  const [category, setCategory] = useState("");
  const [notify, setNotify] = useState(false);
  const [star, setStar] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    const conditions: Record<string, unknown> = { conditionType: "any" };
    const actions: Record<string, unknown> = {};

    const senderList = senders.split(",").map((s) => s.trim()).filter(Boolean);
    if (senderList.length > 0) conditions.senders = senderList;

    const keywordList = keywords.split(",").map((s) => s.trim()).filter(Boolean);
    if (keywordList.length > 0) conditions.keywords = keywordList;

    const subjectList = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    if (subjectList.length > 0) conditions.subjects = subjectList;

    if (category) actions.category = category;
    if (notify) actions.notify = true;
    if (star) actions.star = true;

    onCreate(name.trim(), conditions, actions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Create Custom Rule</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Custom Rule"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sender emails or domains</label>
            <input
              type="text"
              value={senders}
              onChange={(e) => setSenders(e.target.value)}
              placeholder="e.g. boss@co.com, @newsletter.co"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords in body</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. urgent, invoice, meeting"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords in subject</label>
            <input
              type="text"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              placeholder="e.g. alert, report, newsletter"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">No category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4"
              />
              Notify me
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={star}
                onChange={(e) => setStar(e.target.checked)}
                className="w-4 h-4"
              />
              Star email
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            Create Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
}: {
  rule: Rule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const condSummary: string[] = [];
  if (rule.conditions && typeof rule.conditions === "object") {
    const c = rule.conditions as Record<string, unknown>;
    if (Array.isArray(c.senders) && c.senders.length > 0) condSummary.push(`${c.senders.length} sender(s)`);
    if (Array.isArray(c.keywords) && c.keywords.length > 0) condSummary.push(`${c.keywords.length} keyword(s)`);
    if (Array.isArray(c.subjects) && c.subjects.length > 0) condSummary.push(`${c.subjects.length} subject(s)`);
  }

  const actionLabel = rule.actions && typeof rule.actions === "object"
    ? (rule.actions as Record<string, unknown>).category as string
    : undefined;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <input
        type="checkbox"
        checked={rule.enabled}
        onChange={() => onToggle(rule.id, rule.enabled)}
        className="w-4 h-4"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{rule.name}</p>
          {rule.isFocusArea && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-black">
              Focus Area
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {actionLabel ? `→ ${actionLabel}` : ""}
          {actionLabel && condSummary.length > 0 ? " | " : ""}
          {condSummary.join(", ")}
        </p>
      </div>
      <button
        onClick={() => onDelete(rule.id)}
        className="text-red-400 hover:text-red-600 text-sm shrink-0"
        title="Delete rule"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export default function RuleManager() {
  const { user } = useEmail();
  const [rules, setRules] = useState<Rule[]>([]);
  const [focusAreas, setFocusAreas] = useState<Array<{ id: string; label: string }>>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<RuleTemplate | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentUser = user ?? (hydrated ? getSessionItem("emailUser") : null);

  useEffect(() => {
    if (!currentUser) return;
    fetchRules();
    fetchTemplates();
  }, [currentUser]);

  const fetchRules = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/rules?userEmail=${encodeURIComponent(currentUser)}`);
      const data = await res.json();
      setRules(data.rules || []);
      setFocusAreas(data.focusAreas || []);
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/rules/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled, userEmail: currentUser }),
      });
      fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const deleteRule = async (id: string) => {
    if (!currentUser) return;
    if (confirm("Delete this rule?")) {
      try {
        await fetch(`/api/rules/${id}?userEmail=${encodeURIComponent(currentUser)}`, { method: "DELETE" });
        fetchRules();
      } catch (error) {
        console.error("Failed to delete rule:", error);
      }
    }
  };

  const handleApplyTemplate = async (
    conditions: Record<string, unknown>,
    actions: Record<string, unknown>,
  ) => {
    if (!currentUser || !activeTemplate) return;
    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeTemplate.name,
          enabled: true,
          priority: 0,
          conditions,
          actions,
          userEmail: currentUser,
        }),
      });
      setActiveTemplate(null);
      fetchRules();
    } catch (error) {
      console.error("Failed to apply template:", error);
    }
  };

  const handleCreateCustomRule = async (
    name: string,
    conditions: Record<string, unknown>,
    actions: Record<string, unknown>,
  ) => {
    if (!currentUser) return;
    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          enabled: true,
          priority: 0,
          conditions,
          actions,
          userEmail: currentUser,
        }),
      });
      setShowCustomModal(false);
      fetchRules();
    } catch (error) {
      console.error("Failed to create custom rule:", error);
    }
  };

  const focusAreaRules = rules.filter((r) => r.isFocusArea);
  const customRules = rules.filter((r) => !r.isFocusArea);

  if (!currentUser) {
    return <div className="p-4 text-center text-gray-500">Sign in to manage rules.</div>;
  }

  if (loading) {
    return <div className="p-4 text-center">Loading rules...</div>;
  }

  return (
    <div className="space-y-6">
      {focusAreas.length > 0 && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">Your Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((fa) => (
              <span key={fa.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                {fa.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-indigo-600 mt-2">
            Focus area rules are auto-created to catch emails matching your interests.
          </p>
        </div>
      )}

      {focusAreaRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-700">Focus Area Rules</h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">auto</span>
          </div>
          <div className="space-y-2">
            {focusAreaRules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">Custom Rules</h3>
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            + Add Rule
          </button>
        </div>
        {customRules.length === 0 ? (
          <p className="text-gray-400 text-sm">No custom rules yet. Use a template below or create your own.</p>
        ) : (
          <div className="space-y-2">
            {customRules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-sm mb-3">Quick Start Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setActiveTemplate(template)}
              className="text-left p-3 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <p className="font-medium text-sm text-emerald-900">{template.name}</p>
              <p className="text-xs text-emerald-700 mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {activeTemplate && (
        <TemplateModal
          template={activeTemplate}
          onClose={() => setActiveTemplate(null)}
          onApply={handleApplyTemplate}
        />
      )}

      {showCustomModal && (
        <CustomRuleModal
          onClose={() => setShowCustomModal(false)}
          onCreate={handleCreateCustomRule}
        />
      )}
    </div>
  );
}
