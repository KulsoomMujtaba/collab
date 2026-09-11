# Working on Collab

Read `README.md` and `CONTEXT.md` before changing code. Treat `CONTEXT.md` as the current source of truth for product scope, architecture, and progress.

## Guidelines

- Keep the MVP centered on the complete company-to-creator booking journey.
- Prefer thin end-to-end slices over broad unfinished feature sets.
- Use semantic design tokens from `src/app/globals.css`; do not scatter brand hex values through components.
- Keep business logic out of visual components. Put shared domain and data access code under `src/lib`.
- Enforce authorization in Supabase RLS and server-side code, not only in the interface.
- Model money as integer minor units and snapshot commercial terms on a booking.
- Preserve unrelated work and never commit secrets or `.env.local`.
- After every code change, update `CONTEXT.md` with the current implementation status and meaningful decisions.
- Run `npm run lint`, `npm run typecheck`, and a production build when the environment permits.
- Suggest a concise imperative commit subject and a short body listing everything included in the commit.

## Current constraints

- One permanent role per account in the MVP: company or creator.
- One booking represents one sponsored LinkedIn post.
- Currency is EUR; payment happens outside Collab.
- Booking flow: pending → accepted/declined → submitted → completed.
- Agencies, teams UI, payments, chat, reviews, analytics, and AI search are deferred.
