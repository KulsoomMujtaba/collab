# Collab project context

Last updated: 12 September 2026

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
- Message the company inside an accepted collaboration.
- Submit the deliverable only after the company marks the fee as deposited and held.
- Confirm receipt after approved work releases the tracked payment.
- For an accepted request, submit a public LinkedIn deliverable URL.

### Company

- Register with email and password as a company.
- Browse published creators and search or filter by niche.
- View creator details and send a structured campaign request.
- Supply campaign title, objective, deliverable description, desired publish date, and optional notes.
- Track requests and confirm a submitted collaboration as complete.
- Message the creator inside an accepted collaboration.
- Mark the agreed fee as deposited after acceptance.
- Approve submitted work to complete the booking and release the tracked payment.

### Deferred

Real payment processing, standalone inboxes, message attachments, read receipts, typing indicators, negotiation, OAuth, email verification, agencies, team-management UI, reviews, analytics, AI search, and MCP integrations.

## Workflow

`pending → accepted → submitted → completed`

A creator can instead move `pending → declined`. A booking snapshots the creator's fixed rate when requested. After acceptance, the manual payment flow is `awaiting deposit → held → released → received`. Money moves outside Collab; these statuses only coordinate what both parties report.

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
- `booking_messages` stores the lightweight participant thread for each collaboration.
- `booking_payments` stores one escrow-like manual payment state per accepted booking.
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
- Creator profile preview, completion indicator, and resumable draft persistence.
- Real Supabase email/password signup, login, logout, session refresh, and protected onboarding routes.
- Database-backed onboarding drafts and atomic role-specific completion functions.
- Account bootstrap trigger that creates the profile, permanent-role workspace, and owner membership from trusted signup metadata.
- Friendly handling for unexpected Supabase signup rate-limit responses.

The application is configured against a Supabase project through local environment values. It accepts the current `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` convention, with legacy anonymous-key compatibility, and normalizes a copied `/rest/v1` endpoint to the project origin. Never commit local keys. The SQL migrations must be applied to the configured project before registration can bootstrap profiles and workspaces.

Validation target for this phase is a clean type check, lint run, and production build. The build script uses Next's webpack path because Turbopack cannot bind its internal worker port in the current restricted environment. The local machine uses Node 23, which produces a non-blocking engine warning from an ESLint dependency; deployment should use the current Node 22 LTS or Node 24.

Phase 1 frontend validation currently passes across all routes: `/`, `/login`, `/signup`, and `/onboarding/[role]`. The production compiler verifies both company and creator onboarding variants through the shared dynamic route.

## Next slice

Apply `202609120004_booking_messages.sql` and `202609120005_manual_payments.sql` in order. Then exercise messaging and the full manual payment sequence from both roles before deploying both slices.

## Collaboration flow UX refinement

- Creators now submit the public LinkedIn deliverable from the collaboration detail page, directly beside the campaign, payment, and message context.
- The creator request list no longer embeds the full URL form; a funds-held callout links to the focused submission surface instead.
- Company and creator request cards show a compact semantic payment-status badge alongside the booking status.
- Company cards expose the low-risk `awaiting_deposit → held` action, while creator cards expose the final `released → received` confirmation.
- Deliverable review and release, undoing a deposit, and URL submission remain on the detail page to keep list cards readable and prevent consequential actions without context.

Suggested subject: `feat: streamline collaboration payment actions`

Body:

- move creator deliverable submission into collaboration details
- show payment status across company and creator request cards
- add safe next-step payment actions to request lists
- keep review and rollback controls in the focused detail view

## Manual escrow-style payment tracking

- Every accepted booking receives a one-to-one payment record; existing accepted bookings are backfilled as awaiting deposit, submitted bookings as held, and completed bookings as released.
- Company users mark the snapshotted fee as deposited, moving it from `awaiting_deposit → held`; they may undo this only before a deliverable is submitted.
- Creator deliverable submission now requires the payment to be held, enforced inside the existing atomic submission RPC.
- Company approval atomically moves the booking `submitted → completed` and payment `held → released`.
- Creators make the final `released → received` acknowledgement after payment arrives.
- The collaboration detail page shows the fee, four-stage payment progress, timestamps, role-specific next action, and a clear disclaimer that Collab does not move money.
- Direct payment writes are revoked. Participant access, company/creator roles, valid booking states, and all transitions are enforced through security-definer RPCs.
- Payment funding, rollback, release, and receipt append records to the existing booking-event audit trail.

Suggested subject: `feat: add manual escrow payment tracking`

Body:

- track deposited, held, released, and received payment states
- gate delivery on held funds and release on company approval
- add participant-specific payment controls to collaboration details
- audit every manual payment transition in Supabase

## Collaboration messaging

- A shared `/bookings/[id]` detail route presents the complete campaign brief, counterpart, status, commercial terms, submitted deliverable, and collaboration thread.
- Company and creator request cards link into the same detail experience; the database resolves the viewer role and permits access only to the booked creator or requesting company workspace.
- Messages persist in `booking_messages` with sender identity, body, and timestamp and are returned chronologically through participant-scoped RPCs.
- Message sending is available only for accepted, submitted, and completed bookings. Pending, declined, and cancelled bookings show an unavailable state.
- Both frontend validation and the database enforce trimmed plain-text messages between 1 and 2,000 characters.
- The feature deliberately excludes a standalone inbox, attachments, read receipts, typing indicators, editing, and deletion.

Suggested subject: `feat: add collaboration messaging`

Body:

- add participant-only booking messages and secure Supabase RPCs
- create a shared collaboration detail page for both roles
- enable lightweight messaging after creator acceptance
- link company and creator request cards into the collaboration

## Landing page product narrative

- The original hero remains the primary first impression, while every section below it now demonstrates a concrete part of the product.
- The marketplace preview uses four clearly labelled sample profiles with realistic B2B niches, audience sizes, average views, rates, and profile photos, ensuring the landing page always presents a complete marketplace.
- Sample cards are intentionally non-interactive so they cannot be mistaken for real profiles; the actual company marketplace remains fully Supabase-backed.
- A visual lifecycle workspace reuses Collab status badges, request details, deliverable review, and completion controls to explain `pending → accepted → submitted → completed`.
- A focused company-versus-creator section explains the distinct value and responsibilities on each side of the marketplace.
- The page closes with a strong role-aware CTA and a complete product footer.

Suggested subject: `feat: turn the landing page into a product preview`

Body:

- present a complete marketplace preview with realistic sample creators
- demonstrate the collaboration lifecycle through real UI patterns
- clarify the company and creator experiences
- add a focused closing CTA and complete footer

## Production deployment

- Public production URL: `https://naano-wheat.vercel.app`
- Public repository: `https://github.com/KulsoomMujtaba/collab`
- Hosting: Vercel project `naano`.
- Production and build environments use the configured Supabase project URL and publishable key; secrets remain outside source control.
- The public landing, login, and signup routes return successfully from the deployment.
- The Supabase REST API is reachable, and Phase 3C RPCs are present while correctly rejecting anonymous execution.
- Automatic Vercel-to-GitHub linking is not enabled because the Vercel account still needs a GitHub login connection. Manual deployments work; connect GitHub in Vercel later to enable deploy-on-push.

Suggested subject: `docs: record the production deployment`

Body:

- add the public Vercel application link to the project overview
- document production hosting and Supabase verification
- capture the remaining GitHub integration and walkthrough steps

## Authentication and contrast refinement

- The shared primary palette uses a deeper maroon with warm off-white foreground text, improving contrast for every primary button through the semantic design tokens.
- The global anchor reset no longer overrides component text colors, so link-shaped primary buttons correctly render the configured light foreground.
- The landing page reads the current Supabase session on the server and replaces login/signup actions with role-correct workspace and request links for authenticated users.
- Session refresh middleware now includes the landing route, so its authentication-aware navigation remains current.

Suggested subject: `fix: reflect sessions and improve button contrast`

Body:

- strengthen contrast across maroon primary actions
- render role-aware landing page navigation for signed-in users
- link authenticated visitors directly to their workspace and requests
- refresh Supabase sessions on the landing route

Follow-up subject: `fix: restore light text on linked buttons`

Body:

- stop the global anchor reset from overriding button text colors
- use a warm off-white foreground across maroon actions

## Phase 3C implementation

- Accepted creators can submit a public LinkedIn deliverable URL without leaving their request inbox.
- Frontend URL validation checks for a complete LinkedIn URL before submission; the database independently applies the same domain boundary.
- Companies receive the submitted post in their request tracker and review it in a new tab before confirming completion.
- Completion requires an explicit confirmation step to prevent accidental finalization.
- Role-scoped security-definer functions lock the booking and enforce `accepted → submitted → completed` transitions atomically.
- Deliverables remain separate records, while booking submission and completion timestamps make lifecycle reporting straightforward.
- Every successful transition appends an audit event; direct authenticated writes to deliverables and bookings are unavailable.
- Submitted and completed filters and persistent final states are available to both roles.

Suggested subject: `feat: complete the collaboration lifecycle`

Body:

- let creators submit published LinkedIn deliverables
- let companies review and confirm completion
- enforce accepted-to-submitted-to-completed transitions
- preserve final lifecycle events and dashboard states

## Phase 3B implementation

- Creator request inbox with status filters, expandable briefs, pricing, dates, and company context.
- Creator-only accept and decline actions; decline requires explicit confirmation.
- Company request tracker with creator context, status filters, and expandable campaign details.
- Role-scoped read RPCs return only bookings belonging to the current creator or company workspace.
- Booking RPC execution is explicitly unavailable to anonymous clients.
- Atomic response RPC locks the booking, permits only `pending → accepted` or `pending → declined`, timestamps the response, and appends an audit event.
- Workspace navigation and request-success feedback link both roles into their booking views.

Suggested subject: `feat: add booking management and creator decisions`

Body:

- build company and creator request dashboards with status filters
- add expandable campaign details and counterpart context
- support secure creator accept and decline decisions
- record every booking response as an append-only event

## Phase 3A implementation

- Company users can open a collaboration-request side panel directly from a published creator profile.
- Two-stage brief and review experience retains creator context and clearly presents the snapshotted rate.
- Frontend validation covers campaign title, objective, deliverable, future publication date, and optional notes.
- Atomic `create_booking_request` RPC verifies the company and creator, creates the campaign and booking, snapshots price through the existing trigger, and appends the first booking event.
- Direct campaign, booking, and event inserts are revoked from authenticated clients so the secured RPC is the only creation path.
- Anonymous visitors receive a sign-in prompt; creator accounts never receive the company request action.

Suggested subject: `feat: add creator booking requests`

Body:

- add an in-context collaboration request side panel to creator profiles
- validate and review campaign briefs before submission
- create campaigns, bookings, and audit events atomically in Supabase
- enforce company-only request creation and creator availability

## Phase 2C implementation

- Authenticated, company-only `/company` workspace backed by Supabase.
- Published creator query explicitly filters `is_published = true`; RLS independently excludes unpublished profiles from company accounts.
- Responsive creator-card grid prioritizing name, headline, niches, followers, average views, and fixed rate.
- Instant client-side name/headline search and single-niche filtering over server-loaded records.
- Result counts, clear-filter affordances, loading skeleton, no-match state, empty-marketplace state, and connection-error state.
- Completed company onboarding and subsequent logins route directly into discovery.

Suggested subject: `feat: build the company creator marketplace`

Body:

- add the protected company discovery workspace
- load published creators and niches from Supabase
- add responsive search, filtering, creator cards, and empty states
- route completed company accounts into the marketplace

## Phase 2B implementation

- Authenticated creator dashboard with live Supabase profile data and publication status.
- Existing creator data hydrates back into the onboarding form for profile edits.
- Secure publish/unpublish RPC with database-enforced completeness checks.
- Public creator profile route with creator-specific page metadata.
- Private creators can preview their own public presentation while remaining invisible to anonymous visitors through RLS.
- Completed creator login and onboarding flows now lead to the dashboard.

Suggested subject: `feat: add creator profile publishing`

Body:

- add the authenticated creator dashboard and reusable profile presentation
- support editing completed profiles and previewing their public page
- enforce profile completeness through secure publish and unpublish controls
- add public creator routes and document the Phase 2B workflow

Email verification is deliberately outside the MVP scope. Supabase `Confirm Email` must be disabled for the assignment build, allowing registration to establish a session and continue directly into onboarding without sending transactional email.

## Simplified signup commit context

Suggested subject: `fix: streamline MVP signup`

Body:

- remove the email-confirmation step from the MVP journey
- continue successful registration directly into onboarding
- retain useful feedback for unexpected authentication failures
- document the required Supabase confirmation setting

## Phase 1 Supabase commit context

Suggested subject: `feat: connect onboarding to Supabase`

Body:

- connect signup, login, logout, session refresh, and protected routes
- bootstrap role-specific workspaces whenever an account is created
- persist onboarding drafts and complete profiles through secure database functions
- normalize Supabase configuration and document the migration requirement

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
