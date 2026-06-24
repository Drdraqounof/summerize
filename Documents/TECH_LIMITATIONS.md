# Technical Limitations

## Gmail Sync

### Rule-Based Filtering
- **Current**: Gmail sync only imports emails that match active custom rules. If no rules are configured, NO emails are synced from Gmail.
- **Impact**: Users see empty inbox (0 emails) after connecting Gmail until they create custom rules or bulk import is triggered.
- **Workaround**: Manually call `/api/sync` endpoint with `userEmail` and `period="all"` to force import regardless of rules.
- **Root Cause**: `lib/gmail-sync.ts` line 239-246 filters emails through `emailMatchesAnyRule()` before storing.

### No Automatic Sync
- **Current**: Gmail emails are only fetched when explicitly triggered (user connects account or manually triggers sync).
- **Impact**: Inbox doesn't auto-refresh; users must manually trigger updates to see new emails.
- **Missing**: No background job/cron service for periodic sync.
- **Priority**: Medium - Users expect automatic email fetching.

### Focus Area to Rules Gap
- **Current**: Onboarding collects focus areas (e.g., "groceries/events") but doesn't create corresponding sync rules.
- **Impact**: Selected focus areas are saved but don't filter emails during sync - requiring manual rule setup.
- **Solution Needed**: Convert focus areas to default `CustomRule` entries during onboarding completion.

### Sync Scope Limitations
- **Current**: Sync limited to 5 labels only: inbox, spam, promotions, updates, trash
- **Missing**: User-selected custom labels (e.g., "Work", "Personal") are not synced
- **Priority**: Medium - Many users organize Gmail with custom labels.

---

## Email Analysis & Sentiment

### Type Inconsistencies
| Field | Schema | API | Frontend | Status |
|-------|--------|-----|----------|--------|
| `sentimentScore` | Float (0-1) | String (positive/neutral/urgent) | expects String | ❌ Mismatch |
| `bodyHtml` | missing | exists in response | stored in Email | ❌ Inconsistent |
| `actionItems` | JSON | extracted by AI | may be null | ⚠️ Partial |
| `isFlagged` | Boolean | renamed from `isStarred` | awaiting threadId | ⚠️ In progress |

**Impact**: Type errors in ConversationSidebar when rendering contact metrics; ContactCard may receive wrong sentiment format.

### AI Analysis Gaps
- **No automatic re-analysis**: Emails analyzed once, not re-analyzed if rules/rules change
- **Limited extraction**: Only extracts actionItems, dates, sentiment - missing: sender importance, conversation context
- **Single pass**: No iterative refinement of analysis based on user feedback

---

## Frontend Data Display

### Conversation Sidebar Dependencies
- **Requirement**: Email must have `threadId` from Gmail API
- **Current Status**: `threadId` is captured during sync but may be null for old emails
- **Impact**: Sidebar shows incomplete conversation context for emails without threadId

### Filter Logic Bug (FIXED)
- **Previous**: Inbox filter checked `shouldNotify` (AI recommendation) instead of `isFlagged` (user starred)
- **Fix Applied**: Changed to check `isFlagged` and renamed filter from "starred" to "important"
- **Status**: ✅ Fixed in latest version

### Mobile Responsiveness
- **Conversation Sidebar**: Hidden on screens <1024px (desktop only)
- **Impact**: Mobile users don't see contact context, action items, or thread history
- **Workaround**: Desktop version provides full feature set

---

## Database & Performance

### No Pagination
- **Current**: `/api/gmail/messages` fetches up to 500 emails without pagination in UI
- **Impact**: Long scrolling lists may cause performance degradation on older devices
- **Priority**: Low - Affects only large accounts (500+ emails)

### Missing Indexes
- **Current**: Email queries filter by `userId + gmailLabel` and `userId + threadId`
- **Status**: Indexes exist but could be optimized for common queries (userId + isFlagged, userId + category)
- **Priority**: Low - Performance acceptable for <10k emails per user

### No Soft Delete
- **Current**: Deleted emails are permanently removed from database
- **Impact**: User actions not recoverable; audit trail missing
- **Workaround**: Maintain deleted email references in separate table if recovery needed

---

## OAuth & Authentication

### Token Refresh
- **Current**: Access tokens stored in memory; no refresh token rotation
- **Impact**: Long-running syncs may fail mid-operation if token expires
- **Risk**: User must re-authenticate after token expiration

### Single Provider Only
- **Current**: Each user can only connect one email provider (Gmail)
- **Impact**: Cannot aggregate emails from multiple accounts (Gmail + Outlook, etc.)
- **Scope**: Would require significant redesign of email data model

---

## Real-time Features

### No WebSocket Support
- **Current**: Polling-based updates only
- **Impact**: Email notifications delayed; no live collaboration features
- **Architecture**: Would require Socket.io or similar for real-time sync

### Notification Delivery
- **Current**: Browser notifications only (requires user permission + active browser tab)
- **Missing**: Email/SMS delivery for offline users
- **Priority**: Medium - Users may miss important emails

---

## Roadmap & Future Considerations

| Feature | Impact | Effort | Status |
|---------|--------|--------|--------|
| Auto-sync background job | High | Medium | Not Started |
| Focus area → rules conversion | High | Low | Needed ASAP |
| Mobile conversation sidebar | Medium | Medium | Blocked by responsive design |
| Type consistency fixes | High | Low | In Progress |
| Custom label support | Medium | Medium | Planned |
| Multi-provider support | Low | High | Future consideration |
| WebSocket real-time sync | Low | High | Future consideration |

---

## Known Workarounds

### "0 emails" in Inbox
```bash
# Manually trigger full sync via API
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"user@gmail.com","period":"all"}'
```

### Create Default Rules from Focus Areas
- Currently manual step - should be automated in onboarding
- Requires POST to `/api/rules` with conditions matching focus area keywords

---

## Last Updated
- **Date**: 2026-06-24
- **Limitations Count**: 15 active, 3 resolved
- **Priority Items**: Gmail auto-sync, focus area rules conversion, type fixes
