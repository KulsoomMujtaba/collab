# Collab

Collab is a focused marketplace for B2B creator partnerships. Companies discover credible LinkedIn creators, send a structured campaign request, and follow the collaboration through acceptance, delivery, and completion. Creators present their work and manage opportunities without moving the agreement across scattered DMs and spreadsheets.

**Live application:** [naano-wheat.vercel.app](https://naano-wheat.vercel.app)

**Public repository:** [github.com/KulsoomMujtaba/collab](https://github.com/KulsoomMujtaba/collab)

This project is an independent rebuild inspired by the core marketplace workflow of Naano. The goal is not feature parity: it is a polished, complete MVP that proves the most important exchange between a company and a creator.

## MVP journey

1. A creator registers, completes a profile, sets a fixed EUR rate, and publishes it.
2. A company registers and browses or filters published creators.
3. The company sends a campaign request with a concise brief and desired date.
4. The creator accepts or declines the request.
5. An accepted creator submits the published LinkedIn URL.
6. The company confirms completion.

Payments, chat, agencies, AI search, and negotiation are deliberately outside the first release.

## Foundation

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Auth and Postgres with row-level security
- Vercel deployment target
- Semantic design tokens for a replaceable maroon-led visual theme
- Scale-aware workspace, campaign, booking, deliverable, and event model

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add the project URL and publishable key from a fresh Supabase project to `.env.local`. Apply the SQL files in `supabase/migrations` in filename order before testing authenticated flows.

## Project documentation

See [CONTEXT.md](./CONTEXT.md) for product decisions, architecture, status, and the next implementation slice. Contributors and coding agents should read [AGENTS.md](./AGENTS.md) before making changes.

## Assignment delivery

The application is deployed publicly on Vercel. The final submission will also include the public repository and a walkthrough under five minutes. Agent-session capture artifacts are committed under `.agent-logs/` throughout development.
