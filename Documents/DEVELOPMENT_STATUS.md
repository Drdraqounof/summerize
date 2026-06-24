# Mailturtle Development Roadmap

**Last Updated:** June 23, 2026  
**Current Focus:** Building Smart Contact Profiles & Conversation Context Sidebar

---

## What We're Building

We're adding two connected features to help you manage email smarter:

### 1. **Smart Contact Profiles**
See AI-learned information about each person who emails you.

**What you'll see:**
- How important this person is (1-10 scale)
- When you usually reply to them
- How their tone typically comes across
- How often you reply to their emails
- When you last heard from them

**Example:** Open an email from your boss and see "Importance: 9/10 | You usually reply within 4 hours | Last contacted: 2 days ago"

---

### 2. **Conversation Context Sidebar**
See the full conversation history next to the current email.

**What you'll see:**
- Last 5 emails in the conversation
- Tasks you need to do (extracted by AI)
- Important dates mentioned
- Other people involved in the conversation

**Example:** Instead of scrolling back through 10 emails to find the deadline, the sidebar shows "Due: Today EOD" and "Provide feedback by EOD today"

---

## Why These Features?

| Feature | Gmail | Mailturtle |
|---------|-------|-----------|
| **Contact info** | Just name, email | AI-learned relationship data |
| **Response time** | You have to guess | Tells you automatically |
| **Important deadlines** | Buried in email text | Highlighted in sidebar |
| **Task tracking** | Manual (use notes app) | AI extracts automatically |
| **Conversation context** | Scroll through emails | One-glance sidebar summary |

---

## How It Works (Simple Version)

```
When you open an email:

1. App looks at the sender
2. AI checks all past emails from them
3. Calculates importance, patterns, sentiment
4. Shows Contact Card with key info
5. Pulls up conversation thread in sidebar
6. Highlights tasks and deadlines for you
```

---

## Timeline

| Week | What's Done | What's Next |
|------|-----------|-----------|
| **Week 1** | Database setup (Contact model, threadId storage) | Start backend APIs |
| **Week 2** | API endpoints for conversations & contact data | Build sidebar UI |
| **Week 3** | Sidebar component built & tested | Fix bugs, polish |
| **Week 4** | Full testing & launch | Live for all users |

---

## What's Included (MVP)

✅ Contact profiles with relationship metrics  
✅ Conversation threading (groups related emails)  
✅ Sidebar showing last 5 emails  
✅ Action items extracted automatically  
✅ Works on desktop & mobile  

---

## What's NOT Included (For Later)

🔸 Editing contact notes  
🔸 Contact search/filtering  
🔸 Full contact management dashboard  
🔸 Bulk email actions on threads  
🔸 Advanced conversation analytics  

---

## Key Benefits

1. **Save time** — See conversation context without scrolling
2. **Stay organized** — Know task deadlines at a glance
3. **Prioritize** — See who's most important automatically
4. **Respond faster** — Know how quickly each person expects replies
5. **Never miss deadlines** — AI highlights important dates

---

## Technical Changes

**Database:**
- New "Contact" table for relationship data
- New "threadId" field to link related emails
- New "actionItems" field to store extracted tasks

**Backend:**
- New endpoint to fetch conversations by thread
- New endpoint to get contact metrics
- AI prompt enhanced to extract action items

**Frontend:**
- New sidebar component (shows conversation)
- New contact card component (shows relationship info)
- Updated email view to display sidebar

---

## Success Looks Like

- Users can see conversation history without switching views
- Contact importance matches how users actually interact
- Action items are accurately extracted
- Sidebar loads in <500ms
- 50%+ of users viewing emails use the sidebar within first week

---

## Privacy & Security

- Contact data is private to each user (no cross-user sharing)
- All analysis happens on our servers
- Follows same data privacy standards as current mailturtle
- No data sold or shared with third parties

---

## Questions?

Contact team for clarifications on scope, timeline, or feature details.
