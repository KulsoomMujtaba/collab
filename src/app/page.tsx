import { ArrowRight, ArrowUpRight, BadgeCheck, Building2, CalendarCheck, Check, CircleCheck, Link2, Search, Send, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StatusBadge } from "@/components/bookings/status-badge";
import { formatCount, formatRate } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/server";

type LandingCreator = { name: string; headline: string; avatarUrl: string; niches: string[]; followers: number; averageViews: number; rateCents: number };

const sampleCreators: LandingCreator[] = [
  { name: "Maya Chen", headline: "B2B product and growth strategist", avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg", niches: ["SaaS", "Marketing"], followers: 38200, averageViews: 14800, rateCents: 72000 },
  { name: "Daniel Okafor", headline: "Future of work and leadership creator", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg", niches: ["Leadership", "HR"], followers: 24700, averageViews: 9100, rateCents: 54000 },
  { name: "Sofia Alvarez", headline: "Founder-led sales educator", avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg", niches: ["Sales", "Startups"], followers: 51600, averageViews: 19600, rateCents: 89000 },
  { name: "Noah Williams", headline: "AI adoption and operations writer", avatarUrl: "https://randomuser.me/api/portraits/men/46.jpg", niches: ["AI", "Operations"], followers: 31900, averageViews: 12200, rateCents: 65000 },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata.role === "creator" ? "creator" : "company";
  const workspaceHref = role === "creator" ? "/creator" : "/company";
  const requestsHref = role === "creator" ? "/creator/requests" : "/company/requests";

  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></a>
        <div className="flex items-center gap-2 sm:gap-4">
          <a href="#how-it-works" className="hidden text-sm font-medium text-muted hover:text-foreground sm:block">How it works</a>
          {user ? <><SignOutButton /><Link href={workspaceHref} className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover">Your workspace</Link></> : <><Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-surface-muted">Log in</Link><Link href="/signup" className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover">Join Collab</Link></>}
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary"><Sparkles size={15} /> Partnerships, made refreshingly simple</div>
          <h1 className="display max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">Find the right voice for your <span className="text-primary">next big idea.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">Discover trusted B2B creators, send a clear campaign brief, and move from request to published collaboration in one calm workspace.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {user ? <><Link href={workspaceHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:bg-primary-hover">Open your workspace <ArrowRight size={18} /></Link><Link href={requestsHref} className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 font-semibold transition hover:bg-surface-muted">View requests</Link></> : <><a href="#creators" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:bg-primary-hover">Find a creator <ArrowRight size={18} /></a><Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 font-semibold transition hover:bg-surface-muted">Join as a creator</Link></>}
          </div>
          <p className="mt-5 text-sm text-muted">No subscriptions. No hidden fees. Direct partnerships.</p>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/35 blur-3xl" />
          <div className="card-shadow relative rotate-1 rounded-[2rem] border border-border bg-surface p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><span className="text-sm font-semibold">Campaign request</span><span className="rounded-full bg-[#e9f7f0] px-3 py-1 text-xs font-semibold text-success">Accepted</span></div>
            <div className="rounded-2xl bg-surface-muted p-5"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">AM</div><div><p className="font-bold">Amina Malik</p><p className="text-sm text-muted">B2B growth strategist</p></div><BadgeCheck className="ml-auto text-primary" size={20} /></div><div className="my-5 h-px bg-border" /><p className="text-xs font-semibold uppercase tracking-widest text-muted">Campaign</p><p className="mt-1 font-bold">The human side of AI adoption</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface p-3"><p className="text-xs text-muted">Publish by</p><p className="mt-1 font-semibold">24 Sep</p></div><div className="rounded-xl bg-surface p-3"><p className="text-xs text-muted">Creator fee</p><p className="mt-1 font-semibold">€650</p></div></div></div>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted"><CalendarCheck size={17} className="text-primary" /> Everything agreed. Nothing lost in DMs.</div>
          </div>
        </div>
      </section>

      <MarketplacePreview signedIn={Boolean(user)} workspaceHref={workspaceHref} />
      <LifecyclePreview />
      <RoleSection />

      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative"><p className="text-sm font-bold uppercase tracking-[.16em] text-accent">One clear place to collaborate</p><h2 className="display mt-3 max-w-2xl text-4xl font-extrabold sm:text-5xl">Ready to make the next partnership happen?</h2><p className="mt-4 max-w-xl leading-7 text-primary-foreground/75">Create a profile or start discovering B2B creators. The brief, decision, deliverable and final confirmation stay together.</p></div>
          <Link href={user ? workspaceHref : "/signup"} className="relative mt-8 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 font-bold text-primary transition hover:bg-white lg:mt-0">{user ? "Open your workspace" : "Get started with Collab"} <ArrowRight size={18} /></Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between"><div><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><p className="mt-3 max-w-sm text-sm leading-6 text-muted">A focused marketplace for direct B2B creator partnerships.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted"><a href="#creators" className="hover:text-foreground">Creators</a><a href="#how-it-works" className="hover:text-foreground">How it works</a><Link href={user ? workspaceHref : "/login"} className="hover:text-foreground">{user ? "Workspace" : "Log in"}</Link></div></div>
        <div className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© 2026 Collab. Built for thoughtful partnerships.</p><p>Payments and agreements happen directly between both parties.</p></div></div>
      </footer>
    </main>
  );
}

function MarketplacePreview({ signedIn, workspaceHref }: { signedIn: boolean; workspaceHref: string }) {
  return <section id="creators" className="border-y border-border bg-surface py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end"><div><div className="flex flex-wrap items-center gap-3"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Inside the marketplace</p><span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">Sample profiles</span></div><h2 className="display mt-3 text-4xl font-extrabold sm:text-5xl">See the fit before you send the brief.</h2><p className="mt-4 max-w-xl leading-7 text-muted">Compare a creator&apos;s focus, audience and fixed post rate at a glance. Open the full profile only when the essentials line up.</p></div><div className="rounded-2xl border border-border bg-background p-3 sm:flex sm:items-center sm:gap-3"><div className="flex h-11 flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-4 text-sm text-muted"><Search size={17} /> Search by creator name or headline</div><div className="mt-3 flex gap-2 overflow-hidden sm:mt-0">{["All creators", "SaaS", "Leadership", "AI"].map((niche, index) => <span key={niche} className={index === 0 ? "shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground" : "shrink-0 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted"}>{niche}</span>)}</div></div></div>
    <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{sampleCreators.map((creator) => <CompactCreatorCard key={creator.name} creator={creator} />)}</div>
    <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">Illustrative profiles show the information available in the real marketplace.</p><Link href={signedIn ? workspaceHref : "/signup?role=company"} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">{signedIn ? "Open the full marketplace" : "Join to explore creators"} <ArrowUpRight size={15} /></Link></div>
  </div></section>;
}

function CompactCreatorCard({ creator }: { creator: LandingCreator }) {
  return <article className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-accent"><Image unoptimized width={48} height={48} src={creator.avatarUrl} alt={`${creator.name} sample profile`} className="h-full w-full object-cover" /></div><div className="min-w-0"><h3 className="truncate font-bold">{creator.name}</h3><p className="truncate text-xs text-muted">{creator.headline}</p></div></div><div className="mt-4 flex min-h-6 gap-1.5 overflow-hidden">{creator.niches.map((niche) => <span key={niche} className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold text-primary">{niche}</span>)}</div><dl className="mt-4 grid grid-cols-3 border-t border-border pt-4"><div><dt className="text-[10px] text-muted">Followers</dt><dd className="mt-1 text-sm font-bold">{formatCount(creator.followers)}</dd></div><div><dt className="text-[10px] text-muted">Avg. views</dt><dd className="mt-1 text-sm font-bold">{formatCount(creator.averageViews)}</dd></div><div className="text-right"><dt className="text-[10px] text-muted">Post rate</dt><dd className="mt-1 text-sm font-extrabold text-primary">{formatRate(creator.rateCents)}</dd></div></dl></article>;
}

function LifecyclePreview() {
  const steps = [{ label: "Brief sent", note: "Scope and date are clear", icon: Send }, { label: "Creator accepts", note: "The rate is locked in", icon: Check }, { label: "Post submitted", note: "LinkedIn URL is ready", icon: Link2 }, { label: "Complete", note: "Company confirms delivery", icon: CircleCheck }];
  return <section id="how-it-works" className="py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">From request to result</p><h2 className="display mt-3 text-4xl font-extrabold sm:text-5xl">The whole collaboration, in view.</h2><p className="mt-4 leading-7 text-muted">Both sides see the same brief, status and deliverable. Every next action appears where the work already lives.</p></div><div className="mt-12 grid overflow-hidden rounded-[2rem] border border-border bg-surface card-shadow lg:grid-cols-[.82fr_1.18fr]"><div className="border-b border-border bg-surface-muted p-5 sm:p-7 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between"><p className="text-sm font-bold">Collaboration requests</p><span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">4 stages</span></div><div className="mt-6 space-y-2">{steps.map(({ label, note, icon: Icon }, index) => <div key={label} className={index === 2 ? "flex items-center gap-3 rounded-2xl border border-primary/20 bg-surface p-4 shadow-sm" : "flex items-center gap-3 rounded-2xl p-4"}><span className={index <= 2 ? "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground" : "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted"}><Icon size={17} /></span><div><p className="text-sm font-bold">{label}</p><p className="mt-0.5 text-xs text-muted">{note}</p></div>{index < 3 && <span className="ml-auto text-xs font-bold text-muted">0{index + 1}</span>}</div>)}</div></div><div className="p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Campaign</p><h3 className="display mt-1 text-2xl font-extrabold">Product launch collaboration</h3></div><StatusBadge status="submitted" /></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Objective</p><p className="mt-2 text-sm leading-6">Introduce the product through the creator&apos;s genuine point of view.</p></div><div className="rounded-2xl border border-border p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Deliverable</p><p className="mt-2 text-sm leading-6">One sponsored LinkedIn post with a public URL.</p></div></div><div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">Deliverable ready for review</p><p className="mt-1 text-sm text-muted">Open the published post before confirming completion.</p></div><span className="inline-flex items-center gap-2 text-sm font-bold text-primary">View LinkedIn post <ArrowUpRight size={15} /></span></div><div className="mt-4 border-t border-primary/10 pt-4"><span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground"><CircleCheck size={16} /> Confirm completion</span></div></div></div></div></div></section>;
}

function RoleSection() {
  return <section className="border-y border-border bg-surface py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Built for both sides</p><h2 className="display mt-3 text-4xl font-extrabold sm:text-5xl">One partnership. Two focused workspaces.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="rounded-3xl border border-border bg-background p-6 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Building2 size={22} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-primary">For companies</p><h3 className="display mt-2 text-3xl font-extrabold">Find, brief and follow through.</h3><ul className="mt-6 space-y-3 text-sm text-muted">{["Discover only published creator profiles", "Compare niche, reach, views and fixed rate", "Send a structured brief and confirm delivery"].map(item => <li key={item} className="flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-success" />{item}</li>)}</ul><Link href="/signup?role=company" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Create a company account <ArrowRight size={16} /></Link></div><div className="rounded-3xl border border-border bg-background p-6 sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary"><UserRound size={22} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-primary">For creators</p><h3 className="display mt-2 text-3xl font-extrabold">Show your value. Control the work.</h3><ul className="mt-6 space-y-3 text-sm text-muted">{["Publish a clear profile with your own fixed rate", "Review the full campaign brief before accepting", "Submit the live post and keep every status visible"].map(item => <li key={item} className="flex items-start gap-3"><Check size={16} className="mt-0.5 shrink-0 text-success" />{item}</li>)}</ul><Link href="/signup?role=creator" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Create a creator profile <ArrowRight size={16} /></Link></div></div></div></section>;
}
