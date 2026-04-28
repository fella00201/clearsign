# ClearSign

A marketplace where people post rentals, services, and gigs — and sign AI-generated contracts directly in the app.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind + Zustand |
| Database | Supabase (Postgres + Auth + Realtime) |
| Backend | Supabase Edge Functions (Deno) |
| AI | Anthropic Claude Sonnet 4 |
| Email | Resend |
| Hosting | Vercel |
| CI/CD | GitHub Actions |
| Dev agents | Claude Code |

---

## Quick start

### 1. Prerequisites

Install these first:
- [Node.js 20+](https://nodejs.org)
- [Git](https://git-scm.com)
- [VS Code](https://code.visualstudio.com) (recommended)
- Claude Code: `npm install -g claude` (for AI-assisted development)

### 2. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/clearsign.git
cd clearsign
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project (free tier)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/20260501000000_initial_schema.sql`
3. Run it to create all tables
4. Go to **Project Settings → API** and copy your Project URL and anon key

### 4. Set up environment variables

```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
```

Get your Anthropic key at [console.anthropic.com](https://console.anthropic.com).

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying to Vercel

1. Go to [vercel.com](https://vercel.com) → Import Git Repository → select `clearsign`
2. Add environment variables (same as your `.env` file)
3. Deploy

Every push to `main` auto-deploys via GitHub Actions.

---

## GitHub Actions secrets

Add these in **GitHub → Settings → Secrets → Actions**:

| Secret | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings |
| `VITE_ANTHROPIC_API_KEY` | console.anthropic.com |
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env pull` output |
| `VERCEL_PROJECT_ID` | `vercel env pull` output |

---

## AI agent system

This project uses a multi-agent development system powered by Claude Code.

### How it works

1. You describe a feature or bug in plain English
2. The **orchestrator agent** breaks it into subtasks and routes them
3. **Specialist agents** (frontend, backend, QA, review) execute the work
4. GitHub Actions runs tests automatically on every PR
5. Passing PRs are auto-deployed to Vercel

### Running the orchestrator

```bash
claude --system-prompt agents/orchestrator.md
```

Then describe what you want:
> "Add a map view to the listing search using Mapbox"
> "Fix the signing pad on iOS Safari"
> "Add email notifications when a contract is sealed"

### Specialist agents

Run a specific agent directly:
```bash
claude --system-prompt agents/frontend-agent.md
claude --system-prompt agents/backend-agent.md
claude --system-prompt agents/qa-agent.md
```

### Agent files

| File | Role |
|---|---|
| `agents/orchestrator.md` | Reads tasks, routes work, opens PRs |
| `agents/frontend-agent.md` | React screens, components, styling |
| `agents/backend-agent.md` | DB migrations, Edge Functions, email |
| `agents/qa-agent.md` | Tests, bug reproduction, PR approval |
| `agents/review-agent.md` | Code review, security, performance |
| `agents/contract-agent.md` | Contract generation logic |

---

## Project structure

```
clearsign/
├── src/
│   ├── screens/          # One file per screen
│   ├── components/       # Reusable UI components
│   ├── lib/              # supabase.js, anthropic.js, contracts.js
│   ├── data/             # categories.js, tags.js
│   ├── store/            # Zustand stores
│   └── App.jsx
├── supabase/
│   ├── migrations/       # SQL schema files
│   └── functions/        # Edge Functions
├── agents/               # AI agent system prompts
├── tests/
│   └── e2e/              # Playwright tests
└── .github/
    └── workflows/
        └── ci.yml        # Lint → Test → Build → Deploy
```

---

## Commands

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```
