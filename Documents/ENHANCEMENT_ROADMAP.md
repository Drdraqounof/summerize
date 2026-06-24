# Mailturtle Enhancement Roadmap

**Document Date:** June 22, 2026  
**Purpose:** Strategic enhancements to differentiate mailturtle from Gmail and increase user value

---

## Priority Tiers

### 🔴 Critical Fixes (Blocking Features)

These bugs prevent core functionality from working correctly and must be fixed before new features.

#### 1. Fix Broken AI Starring
- **File:** [lib/email-analysis.ts](../lib/email-analysis.ts#L168)
- **Problem:** `isStarred` field doesn't map to `isFlagged` in the database
- **Impact:** All AI-driven starring functionality is broken — users can't flag important emails via AI
- **Fix:** Map `isStarred: result.isStarred` to `isFlagged: result.isStarred` in the Prisma update call

#### 2. Fix Dashboard Trends Calculation
- **File:** [lib/dashboard-stats.ts](../lib/dashboard-stats.ts#L31-L37)
- **Problem:** Previous period math uses object reference comparison instead of timestamp comparison
- **Impact:** Trend percentages are wildly inaccurate (include all emails ever instead of previous period)
- **Fix:** Replace `periodStart === new Date(0)` with `periodStart.getTime() === 0` and compute proper duration offsets

#### 3. Add Authentication to API Endpoints
- **Files:** [app/api/dashboard/stats/route.ts](../app/api/dashboard/stats/route.ts), [app/api/sync/route.ts](../app/api/sync/route.ts)
- **Problem:** Stats and sync endpoints accept plain `userEmail` with no verification
- **Impact:** Security vulnerability — anyone who knows a user's email can view their stats and trigger syncs
- **Severity:** High
- **Fix:** Implement session verification before processing requests (use HTTP-only session cookie, bearer token, or IP/user-agent matching)

---

### 🟡 High-Value Features (Differentiate from Gmail)

These features directly address areas where Gmail falls short and add significant user value.

#### 1. AI-Generated Action Items
- **What:** Extract "what you need to do" from emails automatically
- **Benefit:** One-click visibility into all pending actions across your inbox
- **Implementation:**
  - Extend AI prompt to extract actions (deadline, owner, priority)
  - Show as top-level card in email detail: "You need to: Reply by Friday, Pay invoice #123"
  - Display action items on dashboard as priority list
- **Why Better Than Gmail:** Gmail shows emails but doesn't extract actionable items

#### 2. Smart Notifications
- **What:** Context-aware notification summaries instead of generic "you got an email"
- **Benefit:** Users can decide if they need to act immediately based on notification content
- **Implementation:**
  - Use AI to generate notification preview: "Boss needs your feedback on Q3 plan"
  - Extract urgency (high/medium/low) from email content
  - Digest mode: batch similar emails into one notification
  - Send via browser notification or email digest
- **Why Better Than Gmail:** Gmail sends generic alerts; mailturtle sends intelligent summaries

#### 3. Email Threat Detection
- **What:** Automatically flag phishing, spam, and scam attempts before showing them
- **Benefit:** Proactive security — catch threats before user clicks them
- **Implementation:**
  - Add threat detection category to AI prompt
  - Show confidence score: "90% likely phishing"
  - Visual warning badge on suspicious emails
  - Option to report to Gmail/authorities
- **Why Better Than Gmail:** Complements Gmail's basic spam filter with AI context

#### 4. Time Estimate per Email
- **What:** AI estimates reading time + action time for each email
- **Benefit:** Users can prioritize work based on effort required
- **Implementation:**
  - AI prompt: "Estimate minutes to read and respond to this email (1-60)"
  - Dashboard shows: "You have 2.5 hours of unread email work"
  - Highlight quick wins (< 2 minutes) separately
  - Help users batch similar-length emails
- **Why Better Than Gmail:** Gmail doesn't help users estimate email workload

#### 5. Email Quality Insights
- **What:** Analytics on email patterns and quality
- **Benefit:** Data-driven insights help users optimize their email behavior
- **Implementation:**
  - "45% of your emails are marketing" — with bulk archive suggestion
  - "You reply to 20% of emails within 2 minutes" — response time tracking
  - "Your boss sends 3x more emails on Mondays" — peak stress detection
  - "50% of your emails are unread after 1 week" — attention gaps
- **Why Better Than Gmail:** Gmail has basic stats; mailturtle provides actionable insights

---

### 🟢 UX/Polish Enhancements (Easier Wins)

These improve usability and user experience with moderate effort.

#### 1. Bulk Actions
- **What:** Select multiple emails and apply actions at once
- **Benefit:** Faster email management for common tasks
- **Actions:**
  - "Archive all newsletters from this week"
  - "Re-categorize these 5 emails as Work"
  - "Mark all as read"

#### 2. Search & Advanced Filters
- **What:** Powerful search with saved filters
- **Examples:**
  - "Show unread Work emails from last week"
  - "Starred emails from my boss"
  - "Emails with deadlines"
- **Benefit:** Quick navigation without scrolling

#### 3. Custom Summaries
- **What:** User chooses summary format
- **Options:**
  - "Give me bullet points" (instead of one sentence)
  - "Show sentiment" (positive/negative/neutral)
  - "Highlight deadlines and action items only"
- **Benefit:** Tailored to user's reading style

#### 4. Rule Debugging
- **What:** Show which rules matched each email
- **Example:** "Why was this categorized as Work?" → "Matched rule 'CEO emails'"
- **Feature:** Test rules before enabling them
- **Benefit:** Faster rule configuration

#### 5. Undo/Redo
- **What:** Revert recent categorization changes
- **Examples:**
  - "Undo last 10 categorizations"
  - Audit trail showing what changed and when
- **Benefit:** Safety net for accidental changes

---

### ⚙️ Performance & Scale Enhancements

These reduce costs and improve speed.

#### 1. Batch Analysis
- **What:** Analyze 5+ emails per API call instead of one-by-one
- **Benefit:** Reduce OpenAI costs by 40%+; faster processing
- **Implementation:**
  - Queue emails during sync
  - Send batch to AI API
  - Persist results atomically

#### 2. Local ML (Hybrid Approach)
- **What:** Use lightweight model (TinyBERT) for initial categorization
- **Benefit:** Only use expensive GPT for edge cases; works offline
- **When:** Use local model if confidence > 85%, otherwise use GPT
- **Savings:** 60-70% reduction in API calls

#### 3. Browser Caching
- **What:** Cache AI results in browser IndexedDB for offline viewing
- **Benefit:** Faster email loading; works offline
- **Implementation:**
  - Store summaries, categories, and analysis in IndexedDB
  - Sync when connection returns

---

### 💡 Long-Term Differentiators (Strategic)

These require more work but create lasting competitive advantages.

#### 1. Learning from User Corrections
- **What:** Auto-generate rules from user feedback
- **Example:** If user corrects "Promotions → Work" 3x from a sender, auto-apply that rule
- **Feedback:** "You corrected 12 AI categorizations this week. I've improved."
- **Benefit:** AI gets smarter over time; personalization without manual rule creation

#### 2. Conversation Threading with AI Insights
- **What:** Group related emails by conversation
- **Benefit:** 
  - Summarize entire thread, not just one email
  - Show conversation sentiment trajectory
  - Highlight key decision points
- **Why Better:** Gmail threads emails; mailturtle adds AI context

#### 3. Reply Suggestions
- **What:** "This looks like it needs a response. Suggested reply: [AI draft]"
- **Benefit:** Faster email responses; users edit/approve before sending
- **Why Safer:** Not full automation — user always reviews before sending

#### 4. Email Metrics API
- **What:** Export stats to other apps
- **Integrations:**
  - Slack: "Summarize my inbox each morning"
  - Calendar: "Block time for unread emails"
  - Productivity apps (Notion, Airtable)
- **Benefit:** Integrate email data into user's workflow

#### 5. VIP Contact Predictor
- **What:** AI learns who your most important contacts are
- **Indicators:**
  - Sender frequency and urgency
  - Your response time
  - Conversation length
- **Benefit:** Auto-star and prioritize VIP emails

---

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
1. Fix all critical bugs
2. Deploy authentication improvements
3. Test stability

### Phase 2: Quick Wins (Weeks 3-4)
1. AI Action Items extraction
2. Smart Notifications
3. Email Time Estimates

### Phase 3: Differentiation (Weeks 5-8)
1. Threat Detection
2. Email Quality Insights
3. Batch Analysis (cost optimization)

### Phase 4: Advanced (Weeks 9+)
1. Learning from corrections
2. Conversation threading
3. Reply suggestions
4. Metrics API

---

## Success Metrics

- **Engagement:** DAU/MAU growth
- **Retention:** Week-1 retention rate
- **Feature Usage:** % of users using Action Items, Smart Notifications
- **Cost:** Reduction in OpenAI API spend via batching/local ML
- **Security:** Zero authentication breaches

---

## Notes

- All enhancements maintain privacy-first approach
- Prioritize features that reduce user workload (automation, insights)
- Test thoroughly with beta users before release
- Monitor API costs and optimize as needed
