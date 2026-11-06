# Proposal AI

AI-powered proposal generation and business management platform for freelancers, consultants, agencies and service businesses. Built from the product specification in [`proposal_ai_complete_product_specification-1.md`](../proposal_ai_complete_product_specification-1.md).

## What it does

- **Business profile & branding** — identity, positioning, brand colours, logo, signature, footer
- **Services & packages catalogue** — reusable offerings and Basic/Professional/Enterprise-style packages
- **AI Proposal Studio** — opportunity intake, AI discovery analysis, adaptive questions, recommendation cards (user approves each one), readiness check, multi-page proposal generation
- **Proposal builder** — editable sections, package comparison table (on by default), server-side pricing, versioning, duplication, accepted-version locking
- **Secure acceptance** — hashed, expiring, revocable acceptance tokens; signed acceptance audit trail
- **Quotations** — line items, line/document discounts, tax, decimal-safe totals, snapshots
- **Payments & receipts** — payment ledger, reversals, auto-generated receipts with outstanding balance
- **Client CRM** — pipeline stages, interactions, follow-ups, client lifetime value
- **Projects** — convert accepted proposals, tasks & milestones, weight-based progress
- **Financial dashboard & analytics** — revenue received vs. unpaid value, expenses, proposal/CRM/project analytics
- **Public client portal** — `/p/<token>` responsive proposal view with accept/decline/change-request

## Tech stack

Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL (Neon) + Drizzle ORM · AI SDK (Gemini / Groq / Cerebras provider abstraction) · decimal.js for all financial arithmetic · custom email + password authentication (scrypt-hashed, session cookies)

## Getting started

```bash
cd app
npm install

# Configure environment
cp .env.example .env   # if not present, create .env with the vars below
```

Required `.env` variables:

```
DATABASE_URL=postgres://user:password@localhost:5432/proposalai
AUTH_SECRET=<random string>
# AI providers (optional — app falls back to heuristic questions without them)
GEMINI_API_KEY=
# or
GROQ_API_KEY=
CEREBRAS_API_KEY=
```

Set up the database schema:

```bash
npx drizzle-kit push
```

Run:

```bash
npm run dev      # development
npm run build && npm start   # production
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests for money math, tokens and proposal defaults |

## Design principles (from the spec)

1. AI assists; the business owner decides — recommendations require explicit approval
2. No fabricated credibility — the AI only uses user-supplied evidence
3. Financial accuracy first — all arithmetic is decimal-safe and server-side
4. Secure acceptance — unguessable, expiring, revocable tokens; only hashes stored
5. Version integrity — accepted proposals lock the exact accepted version
6. Real progress — project percentages derive from task/milestone weights
7. Honest analytics — revenue means money received, not proposals sent
8. Privacy by design — every query is scoped to the tenant (`business_id`)
