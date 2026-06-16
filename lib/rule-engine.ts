/**
 * Email Rule Engine
 * Lightweight automation rules matching and application
 */

import { prisma } from "./prisma";

export interface RuleConditions {
  senders?: string[]; // email addresses or domains
  subjects?: string[]; // keywords to match in subject
  keywords?: string[]; // keywords to match in body
  conditionType?: "any" | "all"; // match any or all conditions
}

export interface RuleActions {
  category?: string;
  notify?: boolean;
  star?: boolean;
  labels?: string[];
}

export interface EmailForMatching {
  from: string;
  subject: string;
  body?: string;
  preview?: string;
}

/**
 * Match email against a single rule's conditions
 */
export function matchesConditions(
  email: EmailForMatching,
  conditions: RuleConditions
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return false;
  }

  const conditionType = conditions.conditionType || "any";
  const checks: boolean[] = [];

  // Check senders
  if (conditions.senders?.length) {
    const senderMatch = conditions.senders.some((sender) => {
      const lowerSender = sender.toLowerCase();
      const emailLower = email.from.toLowerCase();
      
      // Support domain matching (e.g., @gmail.com)
      if (lowerSender.startsWith("@")) {
        return emailLower.endsWith(lowerSender);
      }
      // Exact email match
      return emailLower === lowerSender || emailLower.includes(lowerSender);
    });
    checks.push(senderMatch);
  }

  // Check subjects
  if (conditions.subjects?.length) {
    const subjectMatch = conditions.subjects.some((keyword) =>
      email.subject.toLowerCase().includes(keyword.toLowerCase())
    );
    checks.push(subjectMatch);
  }

  // Check keywords in body
  if (conditions.keywords?.length) {
    const body = (email.body || email.preview || "").toLowerCase();
    const keywordMatch = conditions.keywords.some((keyword) =>
      body.includes(keyword.toLowerCase())
    );
    checks.push(keywordMatch);
  }

  // If no conditions were checked, return false
  if (checks.length === 0) return false;

  // Match based on conditionType
  return conditionType === "all"
    ? checks.every((check) => check)
    : checks.some((check) => check);
}

/**
 * Check if an email matches at least one rule's conditions
 */
export function emailMatchesAnyRule(
  email: EmailForMatching,
  rules: Array<{ conditions: RuleConditions }>
): boolean {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => matchesConditions(email, rule.conditions));
}

/**
 * Get applicable rules for an email and return merged actions
 */
export async function getEmailRuleActions(
  userId: string,
  email: EmailForMatching
): Promise<RuleActions> {
  const rules = await prisma.customRule.findMany({
    where: { userId, enabled: true },
    orderBy: { priority: "desc" },
  });

  const mergedActions: RuleActions = {};

  for (const rule of rules) {
    const conditions = (rule.conditions as RuleConditions) || {};
    
    if (matchesConditions(email, conditions)) {
      const actions = (rule.actions as RuleActions) || {};
      
      // Merge actions (later rules can override)
      Object.assign(mergedActions, actions);
    }
  }

  return mergedActions;
}

/**
 * Preset rule templates for quick setup
 */
export const RULE_TEMPLATES = {
  vip_contacts: {
    name: "VIP Contacts",
    description: "Star all emails from specific people",
    conditions: {
      senders: [],
      conditionType: "any",
    },
    actions: {
      star: true,
      notify: true,
    },
  },
  newsletters: {
    name: "Auto-Archive Newsletters",
    description: "Archive newsletter emails after 7 days",
    conditions: {
      subjects: ["newsletter", "digest", "weekly"],
      conditionType: "any",
    },
    actions: {
      category: "Promotions",
      notify: false,
    },
  },
  sales_alerts: {
    name: "Sales Team Alerts",
    description: "Priority notification for sales emails",
    conditions: {
      senders: ["@sales", "sales@"],
      keywords: ["lead", "deal", "opportunity"],
      conditionType: "any",
    },
    actions: {
      category: "Work",
      notify: true,
      star: true,
    },
  },
  project_based: {
    name: "Project-Based Routing",
    description: "Route project emails to specific handling",
    conditions: {
      subjects: ["PROJECT"],
      conditionType: "any",
    },
    actions: {
      category: "Work",
      star: false,
    },
  },
};
