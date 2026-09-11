# Collab project context

Last updated: 11 September 2026

## Product direction

Collab is an independent, simplified B2B creator marketplace. Its first release must let companies discover and book creators and let creators accept and complete those bookings. The experience should feel purposeful and calm, with a fresh identity rather than reproducing Naano visually.

The brand is maroon-led with warm cream, rose, and charcoal supporting colors. All palette choices are semantic CSS variables in `src/app/globals.css`, so rebranding should require token changes rather than component rewrites.

## Committed MVP scope

### Creator

- Register with email and password as a creator.
- Create and edit a profile: display name, headline, bio, country, LinkedIn URL, niches, follower count, average views, fixed EUR price, and optional avatar URL.
- Publish or unpublish the profile.
- View incoming campaign requests.
- Accept or decline a pending request.
- For an accepted request, submit a public LinkedIn deliverable URL.

### Company

- Register with email and password as a company.
- Browse published creators and search or filter by niche.
- View creator details and send a structured campaign request.
- Supply campaign title, objective, deliverable description, desired publish date, and optional notes.
- Track requests and confirm a submitted collaboration as complete.

### Deferred

Payments, internal messaging, negotiation, OAuth, email verification, agencies, team-management UI, reviews, analytics, AI search, and MCP integrations.

## Workflow

`pending → accepted → submitted → completed`

A creator can instead move `pending → declined`. A booking snapshots the creator's fixed rate when requested. Commercial settlement happens outside the product.

## Architecture

- Web: Next.js App Router, React, TypeScript, Tailwind CSS.
- Backend: Supabase Auth and Postgres.
- Hosting: Vercel.
- Authorization: Postgres row-level security plus server-side checks.
- UI: small reusable components and semantic tokens, ready to adopt additional shadcn primitives as interactions grow.

The database is intentionally broader than the first UI:

- `profiles` owns account identity and permanent MVP role.
- `workspaces` and `workspace_members` make future company teams and agencies additive.
- `company_profiles` and `creator_profiles` store role-specific public data.
- `niches` and `creator_niches` support marketplace filtering.
- `campaigns` groups bookings, even though the first company flow creates a campaign inline.
- `bookings` owns the commercial snapshot and status machine.
- `deliverables` stores creator submissions separately from bookings.
- `booking_events` provides an append-only audit history and future notification feed.

This structure can add multi-creator campaigns, agency representation, proposals, messages, payment ledgers, analytics, and smarter discovery without replacing the core entities.

## Security boundaries

- Public visitors may read published creator profiles and niches.
- Users may update only their own identity and role-specific profile.
- Companies may create and read their own campaigns and bookings.
- Creators may read bookings addressed to their creator workspace and make only valid creator transitions.
- Only the requesting company may confirm completion.
- Rates are stored as integer cents and snapshotted by a database trigger when a booking is created, so clients cannot set their own price.

## Current implementation

Phase 0 foundation is complete. Phase 1 frontend implementation now includes:

- Next.js application configuration and dependency manifest.
- Responsive Collab landing page showing the intended visual direction and core proposition.
- Central semantic color, typography, radius, and shadow tokens.
- System-first typography avoids external font requests during builds and keeps deployment deterministic.
- Reusable button and class-name utility.
- Supabase browser and server client boundaries, ready for environment credentials.
- Initial relational schema, indexes, update triggers, seed niches, and row-level security policies.
- Next's automatic agent-rules injection is disabled so the repository's concise `AGENTS.md` remains project-owned.
- Responsive login and registration routes with password controls, role selection, loading states, and Zod validation.
- Role-aware company and three-step creator onboarding experiences.
- Creator profile preview, completion indicator, and local draft persistence.
- Mock authentication transitions kept behind clear preview-mode messaging until Supabase is connected.

No Supabase or Vercel project is connected yet. Never commit local keys.

Validation target for this phase is a clean type check, lint run, and production build. The build script uses Next's webpack path because Turbopack cannot bind its internal worker port in the current restricted environment. The local machine uses Node 23, which produces a non-blocking engine warning from an ESLint dependency; deployment should use the current Node 22 LTS or Node 24.

Phase 1 frontend validation currently passes across all routes: `/`, `/login`, `/signup`, and `/onboarding/[role]`. The production compiler verifies both company and creator onboarding variants through the shared dynamic route.

## Next slice

Validate the Phase 1 interfaces, then connect them to Supabase Auth and replace browser draft storage with workspace and profile persistence. Profile publishing follows after the authenticated onboarding flow is proven.

## Phase 1 frontend commit context

Suggested subject: `feat: build authentication and onboarding flows`

Body:

- add responsive login and role-aware registration interfaces
- create company and multi-step creator onboarding with frontend validation
- persist preview-mode drafts locally and provide a creator profile preview
- connect landing-page entry points and document the Supabase integration boundary

## Phase 0 commit context

Suggested subject: `feat: establish Collab application foundation`

Body:

- scaffold the Next.js, TypeScript, and Tailwind application
- introduce the Collab landing page and semantic maroon design system
- add Supabase-ready client boundaries and the initial marketplace schema
- document the MVP scope, architecture, working agreements, and handoff state
