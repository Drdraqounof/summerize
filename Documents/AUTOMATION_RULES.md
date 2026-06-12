# Email Automation Rules Guide

## Overview

Summerize's automation rules let you automatically categorize, star, and notify on specific emails without manual intervention. Rules are applied during email analysis and can override AI categorization.

## Quick Start

### Using Templates

The easiest way to get started:

1. Go to **Settings → Automation**
2. Click one of the quick-start templates:
   - **VIP Contacts** - Star emails from important people
   - **Auto-Archive Newsletters** - Quiet down newsletters
   - **Sales Team Alerts** - Prioritize sales emails
   - **Project-Based Routing** - Organize by project

3. Rule is instantly active and applies to new emails

## Rule Structure

Each rule has two parts:

### Conditions (When to apply the rule)

Rules match on:

- **Senders** - Email addresses or domains (e.g., `boss@company.com`, `@gmail.com`)
- **Subject keywords** - Text in the email subject
- **Body keywords** - Words anywhere in the email content

Condition types:
- **Any** - Apply if ANY condition matches (OR logic)
- **All** - Apply only if ALL conditions match (AND logic)

### Actions (What to do)

When a rule matches, Summerize can:

- **Category** - Override AI categorization (Work, Personal, Promotions, Alerts, Other)
- **Notify** - Send a notification (`true`/`false`)
- **Star** - Mark as important (`true`/`false`)
- **Labels** - Add custom labels (future)

## Examples

### Example 1: CEO Emails

**Rule Name:** Executive Priority

**Conditions:**
- Senders: `ceo@company.com`
- Condition type: Any

**Actions:**
- Category: Work
- Notify: true
- Star: true

**Result:** All emails from your CEO are categorized as Work, starred, and you get notified immediately.

---

### Example 2: Newsletter Digest

**Rule Name:** Weekly Newsletters

**Conditions:**
- Subjects: `newsletter`, `digest`, `weekly`
- Condition type: Any

**Actions:**
- Category: Promotions
- Notify: false

**Result:** Newsletters are quietly categorized as Promotions without notifications.

---

### Example 3: Project-Based

**Rule Name:** Project X

**Conditions:**
- Subjects: `Project X`
- Senders: `@project-x-team.com`
- Condition type: All

**Actions:**
- Category: Work
- Star: true

**Result:** Only emails from Project X team that mention "Project X" in subject get starred.

---

## How Rules Work

1. **Email arrives** from Gmail
2. **Rule matching** happens first (in priority order)
3. **Conditions checked** - Does email match?
4. **Actions applied** - If matched, actions override AI defaults
5. **AI analysis** - Only for fields not set by rules
6. **Result saved** - Email with rule + AI analysis stored

### Priority

Rules with higher priority numbers run first. First matching rule wins.

- Default priority: 0
- VIP rule might be: 10 (runs before others)
- Catch-all rule might be: -10 (runs last)

## API Reference

### List Rules

```bash
GET /api/rules
```

### Create Rule

```bash
POST /api/rules
{
  "name": "My Rule",
  "enabled": true,
  "priority": 0,
  "conditions": {
    "senders": ["sender@example.com"],
    "subjects": ["keyword"],
    "conditionType": "any"
  },
  "actions": {
    "category": "Work",
    "notify": true,
    "star": false
  }
}
```

### Update Rule

```bash
PATCH /api/rules/{id}
{
  "enabled": false,
  "priority": 5
}
```

### Delete Rule

```bash
DELETE /api/rules/{id}
```

### Get Templates

```bash
GET /api/rules/templates
```

## Best Practices

### Do ✅

- Keep rules simple and specific
- Use higher priority for VIPs
- Test with one email first
- Use templates when possible
- Disable rules instead of deleting for trial

### Don't ❌

- Create overly broad rules (they'll catch unintended emails)
- Use 100+ rules (performance impact)
- Override category on everything (AI is good at general categorization)
- Forget to enable important rules

## Troubleshooting

### Rule not working

1. Check if rule is **enabled** (toggle in UI)
2. Verify **conditions** are correct (check exact spelling)
3. Ensure **priority** isn't lower than conflicting rules
4. Test with an email you know should match

### Rule blocking other rules

Rules stop matching once a match is found. Use **priority** to control order:
- Higher number = runs first
- Use priority 10+ for VIP rules
- Use priority -10 for catch-all rules

### Too many rules

Consider combining similar rules:
- Multiple newsletter senders → one rule with `["sender1@...","sender2@..."]`
- Multiple keywords → single rule with multiple subjects

## Future Enhancements

Coming soon:
- Rule test/preview mode
- Rule statistics (emails matched)
- Archive actions
- Forward actions
- Scheduled rule triggers

---

**Need help?** See [AI_IMPLEMENTATION.md](./AI_IMPLEMENTATION.md) for overall system documentation.
