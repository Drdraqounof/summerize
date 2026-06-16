# Rule-Based Sync Filtering

Only emails matching user-defined rules are synced, analyzed, or displayed.

## Pipeline

```
Gmail API → fetch message → check rules → NO → skip (never stored)
                                         → YES → store in DB → AI analysis → inbox/dashboard
```

## Implementation

### 1. Sync-time filtering (`lib/gmail-sync.ts`)

`syncGmailLabel()` accepts an optional `rules` parameter. Before each `prisma.email.upsert()`, it checks the email against all active rules via `emailMatchesAnyRule()`:

```typescript
if (rules && rules.length > 0) {
  const emailForMatching: EmailForMatching = {
    from: record.from,
    subject: record.subject,
    body: record.body,
  };
  if (!emailMatchesAnyRule(emailForMatching, rules)) {
    continue; // never stored in DB
  }
}
```

### 2. Rule loading (`app/api/sync/route.ts`)

At the start of every sync, active rules are fetched and passed to the sync function:

```typescript
const activeRules = await prisma.customRule.findMany({
  where: { userId: user.id, enabled: true },
  select: { conditions: true },
});
const ruleConditions = activeRules.map((r) => ({
  conditions: r.conditions as RuleConditions,
}));
```

### 3. Analysis safety filter (`lib/email-analysis.ts`)

`analyzeUnanalyzedEmails()` also accepts an optional `rules` param. After loading unanalyzed emails from the DB, it re-checks each against the rules as a safety net:

```typescript
const matchedAnalysisInput = (rules && rules.length > 0)
  ? analysisInput.filter((email) => emailMatchesAnyRule(emailForMatching, rules))
  : analysisInput;
```

### 4. Rule matching (`lib/rule-engine.ts`)

`emailMatchesAnyRule()` checks an email against all rule conditions:

```typescript
export function emailMatchesAnyRule(
  email: EmailForMatching,
  rules: Array<{ conditions: RuleConditions }>
): boolean {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => matchesConditions(email, rule.conditions));
}
```

Each rule's `conditions` can match on:
- **Senders** — exact email or domain (`@company.com`)
- **Subject keywords** — substring match (case-insensitive)
- **Body keywords** — substring match (case-insensitive)
- **Condition type** — `"any"` (OR) or `"all"` (AND)

### 5. Focus area auto-rules (`lib/focus-area-rules.ts`)

During onboarding, selecting focus areas auto-creates rules with predefined keywords:

| Focus Area | Keywords | Category |
|---|---|---|
| Groceries | grocery, instacart, receipt, store, ... | Personal |
| Work | client, project, meeting, deadline, ... | Work |
| Events | event, invite, ticket, webinar, ... | Other → (removed) |
| Deals | deal, discount, coupon, promotion, ... | Promotions |

Custom focus areas also get keyword-based rules created.

## What gets excluded

Emails that don't match any rule condition:
- Are never upserted to PostgreSQL
- Are never sent to OpenAI for analysis
- Never appear in the inbox, spam, or dashboard views
- Are not counted in dashboard stats

## Edge cases

- **No rules exist** (new user before onboarding): sync skips all emails, returns 0 synced. User must complete onboarding to create focus area rules.
- **Rule conditions are empty** (no senders/subjects/keywords): `matchesConditions()` returns `false`, so nothing matches. Add at least one keyword or sender.
- **"Other" category removed**: The valid AI categories are now `Work | Personal | Promotions | Alerts`. Emails that don't fit are excluded at sync time, not by the AI.
