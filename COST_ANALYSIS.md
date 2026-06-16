# MailTurtle — Cost & Profit Analysis

## Monthly Costs (100 users, 50 emails/day avg)

| Item | Cost |
|---|---|
| OpenAI (GPT-4o-mini) | ~$21/mo |
| Gmail API | $0 |
| Vercel hosting (estimate) | $20–50/mo |
| **Total cost** | **~$41–71/mo** |

## Pricing Scenarios

| Charge/user/mo | Revenue (100 users) | Monthly profit | Yearly profit |
|---|---|---|---|
| $1 | $100 | ~$30–60 | ~$360–720 |
| $3 | $300 | ~$230–260 | ~$2,760–3,120 |
| $5 | $500 | ~$430–460 | ~$5,160–5,520 |
| $10 | $1,000 | ~$930–960 | ~$11,160–11,520 |

## At Scale (1000 users, $5/mo)

| Item | Amount |
|---|---|
| Revenue | $5,000/mo |
| OpenAI | ~$210/mo |
| Vercel | ~$200–500/mo |
| **Profit** | **~$4,300–4,600/mo** |

## Key Notes

- Costs scale **linearly** with users and email volume
- Gmail API stays free at this scale
- OpenAI cost drops per-user if batch analysis improves efficiency
- Vercel costs grow with compute usage (serverless function calls)
