# Feature Update: Smart Contact Profiles & Conversation Context Sidebar

**Date:** June 23, 2026  
**Status:** In Development (Phase 1 Complete - Database Schema)  
**Timeline:** 3-4 weeks to MVP

---

## Overview

We're shipping two deeply integrated features to mailturtle that differentiate from Gmail while staying true to AI-powered inbox flow:

1. **Smart Contact Profiles** — AI learns relationships and shows contact intelligence
2. **Conversation Context Sidebar** — Thread history + action items + relationship insights

Together, these create a light CRM layer that helps users prioritize and manage conversations with rich context.

---

## Feature 1: Smart Contact Profiles

### What It Does

When you open an email, a **Contact Card** appears showing AI-learned relationship intelligence about the sender.

### Contact Card Display

```
┌─────────────────────────────────────┐
│  Sarah Chen (boss@company.com)      │
├─────────────────────────────────────┤
│  ⭐⭐⭐⭐⭐ Importance: 9/10          │
│                                     │
│  📧 Emails: 127 total               │
│  📅 Last contacted: 2 days ago      │
│  ⏱️ Response time: 4 hours avg      │
│  📈 Sentiment: Mostly urgent        │
│  ↩️ Reply rate: 95% (you reply)    │
│                                     │
│  Communication Pattern:             │
│  You usually reply within 4 hours   │
│                                     │
└─────────────────────────────────────┘
```

### Key Metrics

- **Importance Score (1-10)** — How important this contact is to you
  - Calculated from: email frequency, your reply rate, how often you star their emails, AI importance assessment
  
- **Communication Pattern** — "You usually reply within X hours"
  - Calculated from: average response time between their email → your reply
  
- **Sentiment Trend** — Are they usually positive, neutral, or urgent?
  - Calculated from: AI sentiment analysis of their recent emails
  - Shows: positive 🟢, neutral ⚪, urgent/negative 🔴
  
- **Response Rate** — "You reply to X% of their emails"
  - Calculated from: emails received ÷ emails you replied to
  
- **Last Interaction** — "Last emailed 2 weeks ago"
  - Exact last contact date from email timestamp
  
- **Total Emails** — "127 emails total"
  - Count of all emails from this contact across your inbox

### Why It's Different From Gmail

| Feature | Gmail | Mailturtle |
|---------|-------|-----------|
| Contact info | Shows name, email, phone (if added) | Shows AI-learned relationship metrics |
| Importance | Manual star/flag | AI-calculated from behavior |
| Communication pattern | Not available | Learned automatically from history |
| Sentiment | Not available | AI extracts from email content |
| Response patterns | Manual review needed | Auto-calculated from email history |
| Last contact | You have to check | Displayed at a glance |

### Use Cases

1. **Prioritization** — "This contact is importance 9/10, I should reply quickly"
2. **Context** — "I usually reply to them in 4 hours, not 24 hours—this is urgent"
3. **VIP Detection** — "This sender gets 95% of my replies, they're a priority"
4. **Relationship health** — "I haven't emailed them in 3 months, maybe I should reach out"
5. **Pattern recognition** — "This person is always urgent, I should scan emails from them carefully"

---

## Feature 2: Conversation Context Sidebar

### What It Does

When you open an email, a sidebar appears on the right showing:
- **Thread history** — Past 5-10 emails with this contact
- **Action Items** — Unresolved tasks extracted from the thread
- **Key Dates/Deadlines** — Important dates AI found in emails
- **Suggested Response** — "This usually warrants a reply within 24 hours"
- **Related Contacts** — "Also emailed with Sarah about this"

### Sidebar Layout

```
╔════════════════════════════════════════════════════════╗
║  EMAIL DETAIL                   │  CONVERSATION SIDEBAR║
║                                 │                      │
║  Subject: Q3 Planning Meeting   │ Sarah Chen (9/10)   │
║  From: boss@company.com         │ ⭐⭐⭐⭐⭐            │
║  Date: Jun 23, 2026             │                      │
║                                 │ THREAD (5 emails)   │
║  [Email Body...]                │ ─────────────────── │
║                                 │ Jun 23: "Need       │
║                                 │  feedback by EOD"   │
║                                 │ Jun 22: "Attached   │
║                                 │  draft plan"        │
║                                 │ Jun 20: "Setup      │
║                                 │  meeting for Q3?"   │
║                                 │ Jun 15: [reply]     │
║                                 │ Jun 10: [original]  │
║                                 │                      │
║                                 │ ACTION ITEMS        │
║                                 │ ─────────────────── │
║                                 │ ☐ Provide feedback  │
║                                 │   by EOD today      │
║                                 │ ☐ Share comments    │
║                                 │   on draft          │
║                                 │                      │
║                                 │ KEY DATES           │
║                                 │ ─────────────────── │
║                                 │ • Due: Today EOD    │
║                                 │ • Meeting: Jun 25   │
║                                 │                      │
║                                 │ RELATED PEOPLE      │
║                                 │ ─────────────────── │
║                                 │ Also discussing:    │
║                                 │ • John (CC'd)       │
║                                 │ • Sarah (prev email)│
║                                 │                      │
╚════════════════════════════════════════════════════════╝
```

### Sidebar Sections

#### 1. **Thread History (Last 5-10 Emails)**
- Scrollable list of related emails in the conversation
- Shows: date, sender, subject line, 1-line preview
- Click to load that email in the main view
- Helps you catch up on context without switching views

#### 2. **Action Items**
- AI-extracted tasks from the thread
- Shows: what needs to be done, who owns it, deadline
- Format: "Provide feedback by EOD today" (extracted from email content)
- Checked off manually when completed (optional)

#### 3. **Key Dates/Deadlines**
- Dates AI found across the thread
- Format: "Due: Today EOD" or "Meeting: Jun 25"
- Helps you see all deadlines in one place

#### 4. **Suggested Response**
- Pattern-based: "This usually warrants a reply within 24 hours"
- Calculated from your historical communication pattern with this contact
- Nudges you to respond if it's been too long

#### 5. **Related Contacts**
- "Also emailed with Sarah about this"
- Shows other people in the conversation thread
- Helps you remember who else is involved

### Why It's Different From Gmail

| Feature | Gmail | Mailturtle |
|---------|-------|-----------|
| Thread view | Shows emails in thread, must scroll | Shows last 5-10 + summaries in sidebar |
| Action items | You manually track (or use Outlook tasks) | AI extracts from thread automatically |
| Deadlines | Hidden in email text | AI highlights in Key Dates section |
| Response pattern | Not available | Learned from your history |
| Related people | Shows TO/CC line | Also shows people from previous emails |
| Context at a glance | Must read full thread | Sidebar gives you snapshot |

### Use Cases

1. **Quick context** — "What was the original ask?" (scroll sidebar, not full emails)
2. **Deadline tracking** — "What do I need to do by when?" (Action Items + Key Dates)
3. **Follow-up nudge** — "They usually get a reply from me in 24h, and it's been 36h"
4. **Staying in sync** — "Who else is in this conversation and what's their role?"
5. **Executive summary** — "Give me the conversation summary without reading 10 emails"

---

## Architecture Changes

### Database
- **New Contact model:** Stores contact relationship metrics (importance, sentiment, response times)
- **Email model updates:** 
  - Add `threadId` field (links to Gmail's conversation thread)
  - Add `actionItems` field (extracted tasks from AI analysis)

### Backend APIs
- **New `/api/conversations/[threadId]`:** Fetch all emails in a thread + Contact card data
- **Updated email analysis:** AI prompt now extracts action items and key dates
- **Contact aggregation logic:** Computes metrics from email history

### Frontend
- **New ConversationSidebar component:** Displays thread history + action items
- **New ContactCard component:** Shows contact relationship metrics
- **Updated EmailDetail:** Integrates sidebar into email view (70/30 layout)

---

## Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **1: Database** | Week 1 | Contact model + threadId + actionItems fields |
| **2: Backend** | Week 1-2 | Contact aggregation logic + Conversation API + Action item extraction |
| **3: Frontend** | Week 2-3 | Sidebar + Contact card components + Integration |
| **4: Testing** | Week 3-4 | E2E tests + Performance optimization |
| **MVP Launch** | End Week 4 | Conversation Context Sidebar with Smart Contact Profiles |

---

## MVP Scope

**Included:**
✅ Contact model with relationship metrics  
✅ ThreadId persistence + conversation grouping  
✅ Sidebar with last 5 emails + contact card  
✅ Action item extraction  
✅ Responsive UI (desktop + mobile stacking)  

**Excluded (Phase 2+):**
❌ Contact management UI (edit notes, custom importance)  
❌ Conversation search/filtering  
❌ Reply tracking (who replied first)  
❌ Full contact history dashboard  
❌ Bulk actions on conversations  

---

## Success Metrics

1. **Adoption** — % of users who view the sidebar when opening emails
2. **Engagement** — Avg time spent viewing conversation sidebar
3. **Value** — User feedback on usefulness of contact metrics
4. **Performance** — Sidebar loads <500ms; doesn't block email detail rendering
5. **Accuracy** — Action items correctly extracted; contact metrics match user perception

---

## Notes

- Features work together: Contact Profile tells you *who* is important; Sidebar tells you *what* they need
- Both features stay within AI + inbox flow (no separate CRM interface)
- Light CRM angle without the bloat—just enough context to make email management smarter
- Privacy-first: Contact data scoped to individual user; no cross-user visibility
