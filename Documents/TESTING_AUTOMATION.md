# Testing Automation Rules

Quick reference for testing the automation features locally.

## Setup

```bash
# 1. Run migration
npx prisma migrate dev --name enhance_custom_rules

# 2. Restart dev server
npm run dev
```

## Via UI

1. Go to `http://localhost:3001/settings`
2. Click "Quick Start Templates"
3. Try "VIP Contacts" template
4. Check that rule appears in list

## Via API

### Create a Rule

```bash
curl -X POST http://localhost:3001/api/rules \
  -H "Content-Type: application/json" \
  -H "Cookie: $(your-auth-session-cookie)" \
  -d '{
    "name": "Test CEO",
    "enabled": true,
    "priority": 10,
    "conditions": {
      "senders": ["boss@company.com"],
      "conditionType": "any"
    },
    "actions": {
      "category": "Work",
      "notify": true,
      "star": true
    }
  }'
```

### List Rules

```bash
curl http://localhost:3001/api/rules \
  -H "Cookie: $(your-auth-session-cookie)"
```

### Get Templates

```bash
curl http://localhost:3001/api/rules/templates
```

### Update Rule

```bash
curl -X PATCH http://localhost:3001/api/rules/{RULE_ID} \
  -H "Content-Type: application/json" \
  -H "Cookie: $(your-auth-session-cookie)" \
  -d '{
    "enabled": false
  }'
```

### Delete Rule

```bash
curl -X DELETE http://localhost:3001/api/rules/{RULE_ID} \
  -H "Cookie: $(your-auth-session-cookie)"
```

## Test Rule Matching

1. Create a rule matching your own email (`from: your-email@example.com`)
2. Send test email matching the conditions
3. Check that email gets:
   - Correct category
   - Star icon (if star action enabled)
   - Notification (if notify action enabled)

## Via Database

```sql
-- View all rules for a user
SELECT * FROM "CustomRule" 
WHERE "userId" = 'your-user-id' 
ORDER BY "priority" DESC;

-- View rule details
SELECT 
  name, 
  enabled, 
  priority,
  conditions,
  actions
FROM "CustomRule"
WHERE id = 'rule-id';
```

## Debug

### Rules not applying

- Check rule is **enabled** in UI
- Verify conditions match email exactly
- Check priority (higher = runs first)
- Look for conflicting rules

### Rule matching details

In browser console:
```javascript
// Create test rule data
const rule = {
  conditions: {
    senders: ["test@example.com"],
    subjects: ["important"],
    conditionType: "any"
  }
};

// Test email
const email = {
  from: "test@example.com",
  subject: "important update",
  body: "some content"
};
```

## Known Limitations (Light Touch Version)

- ✅ Single email analysis gets rules applied
- ⚠️ Batch email analysis doesn't apply rules yet (future enhancement)
- ✅ UI shows all rules and templates
- ⚠️ No rule test/preview mode yet (future enhancement)
- ✅ Rules persist to database
- ⚠️ No rule versioning/history (future enhancement)

## Next Steps

- Add batch rule application
- Add rule preview/test mode
- Add rule statistics (emails matched)
- Add more action types (forward, archive)
- Add rule templates import/export

---

Need help? See [AUTOMATION_RULES.md](./AUTOMATION_RULES.md)
