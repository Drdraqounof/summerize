import { prisma } from "./prisma";
import { focusAreaOptions, isCustomFocusAreaId, parseCustomFocusAreaId, type CustomFocusArea } from "./onboarding";

export interface FocusAreaRuleDefinition {
  focusAreaId: string;
  name: string;
  enabled: boolean;
  conditions: {
    keywords?: string[];
    senders?: string[];
    subjects?: string[];
    conditionType?: "any" | "all";
  };
  actions: {
    category?: string;
    notify?: boolean;
    star?: boolean;
  };
}

const FOCUS_AREA_RULES: Record<string, FocusAreaRuleDefinition> = {
  groceries: {
    focusAreaId: "groceries",
    name: "Groceries & Shopping",
    enabled: true,
    conditions: {
      keywords: ["grocery", "instacart", "pickup", "delivery", "receipt", "store"],
      conditionType: "any",
    },
    actions: {
      category: "Personal",
      notify: false,
    },
  },
  work: {
    focusAreaId: "work",
    name: "Work & Projects",
    enabled: true,
    conditions: {
      keywords: ["client", "project", "meeting", "deadline", "team", "manager"],
      conditionType: "any",
    },
    actions: {
      category: "Work",
      notify: true,
      star: true,
    },
  },
  events: {
    focusAreaId: "events",
    name: "Events & Invitations",
    enabled: true,
    conditions: {
      keywords: ["event", "invite", "ticket", "calendar", "schedule", "webinar"],
      conditionType: "any",
    },
    actions: {
      category: "Alerts",
      notify: true,
    },
  },
  deals: {
    focusAreaId: "deals",
    name: "Deals & Promotions",
    enabled: true,
    conditions: {
      keywords: ["deal", "discount", "coupon", "promotion", "sale", "offer"],
      conditionType: "any",
    },
    actions: {
      category: "Promotions",
      notify: false,
    },
  },
};

function getPredefinedRuleName(focusAreaId: string): string | undefined {
  return FOCUS_AREA_RULES[focusAreaId]?.name;
}

function focusAreaRuleNames(): Set<string> {
  const names = Object.values(FOCUS_AREA_RULES).map((r) => r.name.toLowerCase());
  return new Set(names);
}

function isFocusAreaRule(name: string): boolean {
  const known = focusAreaRuleNames();
  if (known.has(name.toLowerCase())) return true;
  if (name.startsWith("Custom: ")) return true;
  return false;
}

export async function syncFocusAreaRules(userId: string): Promise<number> {
  const userPref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { focusAreas: true },
  });

  if (!userPref?.focusAreas?.length) return 0;

  const existingRules = await prisma.customRule.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existingRules.map((r: { name: string }) => r.name.toLowerCase()));

  let created = 0;

  for (const focusId of userPref.focusAreas) {
    if (isCustomFocusAreaId(focusId)) {
      // Handle custom focus area
      const custom = parseCustomFocusAreaId(focusId);
      if (!custom) continue;

      const ruleName = `Custom: ${custom.label}`;
      if (existingNames.has(ruleName.toLowerCase())) continue;

      await prisma.customRule.create({
        data: {
          userId,
          name: ruleName,
          enabled: true,
          isActive: true,
          conditions: {
            keywords: custom.keywords,
            conditionType: "any",
          },
          actions: {
            category: custom.label,
            notify: true,
          },
        },
      });
      created++;
    } else {
      // Handle predefined focus area
      const ruleName = getPredefinedRuleName(focusId);
      if (!ruleName) continue;
      if (existingNames.has(ruleName.toLowerCase())) continue;

      const ruleDef = FOCUS_AREA_RULES[focusId];
      await prisma.customRule.create({
        data: {
          userId,
          name: ruleName,
          enabled: true,
          isActive: true,
          conditions: ruleDef.conditions,
          actions: ruleDef.actions,
        },
      });
      created++;
    }
  }

  if (created > 0) {
    console.log(`[FocusAreaRules] Created ${created} rules for user ${userId}`);
  }

  return created;
}

export async function getTaggedRules(userId: string) {
  const rules = await prisma.customRule.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      isActive: true,
      conditions: true,
      actions: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return rules.map((r: { id: string; name: string; isActive: boolean; conditions: unknown; actions: unknown; createdAt: Date; updatedAt: Date }) => ({
    id: r.id,
    name: r.name,
    enabled: r.isActive,
    priority: 0,
    conditions: r.conditions,
    actions: r.actions,
    createdAt: r.createdAt.toISOString(),
    isFocusArea: isFocusAreaRule(r.name),
  }));
}
