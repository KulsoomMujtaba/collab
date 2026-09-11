import { ArrowRight, BadgeCheck, CalendarCheck, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";

const creators = [
  { initials: "AM", name: "Amina Malik", role: "B2B growth strategist", niche: "Marketing", followers: "42K", rate: "€650" },
  { initials: "JL", name: "Jonas Lee", role: "Future of work creator", niche: "SaaS", followers: "28K", rate: "€480" },
  { initials: "SR", name: "Sofia Reyes", role: "Founder & sales educator", niche: "Sales", followers: "61K", rate: "€820" },
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary">
            <Sparkles size={15} /> Partnerships, made refreshingly simple
          </div>
          <h1 className="display max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
            Find the right voice for your <span className="text-primary">next big idea.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Discover trusted B2B creators, send a clear campaign brief, and move from request to published collaboration in one calm workspace.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {user ? <><Link href={workspaceHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:bg-primary-hover">Open your workspace <ArrowRight size={18} /></Link><Link href={requestsHref} className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 font-semibold transition hover:bg-surface-muted">View requests</Link></> : <><a href="#creators" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:bg-primary-hover">Find a creator <ArrowRight size={18} /></a><Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-surface px-6 font-semibold transition hover:bg-surface-muted">Join as a creator</Link></>}
          </div>
          <p className="mt-5 text-sm text-muted">No subscriptions. No hidden fees. Direct partnerships.</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/35 blur-3xl" />
          <div className="card-shadow relative rotate-1 rounded-[2rem] border border-border bg-surface p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between"><span className="text-sm font-semibold">Campaign request</span><span className="rounded-full bg-[#e9f7f0] px-3 py-1 text-xs font-semibold text-success">Accepted</span></div>
            <div className="rounded-2xl bg-surface-muted p-5">
              <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">AM</div><div><p className="font-bold">Amina Malik</p><p className="text-sm text-muted">B2B growth strategist</p></div><BadgeCheck className="ml-auto text-primary" size={20} /></div>
              <div className="my-5 h-px bg-border" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Campaign</p><p className="mt-1 font-bold">The human side of AI adoption</p>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface p-3"><p className="text-xs text-muted">Publish by</p><p className="mt-1 font-semibold">24 Sep</p></div><div className="rounded-xl bg-surface p-3"><p className="text-xs text-muted">Creator fee</p><p className="mt-1 font-semibold">€650</p></div></div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm text-muted"><CalendarCheck size={17} className="text-primary" /> Everything agreed. Nothing lost in DMs.</div>
          </div>
        </div>
      </section>

      <section id="creators" className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-bold uppercase tracking-[.16em] text-primary">Creator marketplace</p><h2 className="display text-3xl font-bold sm:text-4xl">People worth partnering with</h2></div><div className="flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted"><Search size={17} /> Search by name or niche</div></div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{creators.map((creator) => <article key={creator.name} className="rounded-3xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:shadow-lg"><div className="mb-8 flex items-start justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">{creator.initials}</div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary">{creator.niche}</span></div><h3 className="text-lg font-bold">{creator.name}</h3><p className="mt-1 text-sm text-muted">{creator.role}</p><div className="mt-6 flex items-end justify-between border-t border-border pt-5"><div><p className="text-xs text-muted">LinkedIn audience</p><p className="font-bold">{creator.followers}</p></div><div className="text-right"><p className="text-xs text-muted">From</p><p className="font-bold">{creator.rate}</p></div></div></article>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">One simple flow</p><h2 className="display mx-auto mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Discover. Request. Publish.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-muted">Collab keeps both sides aligned from the first brief to the final LinkedIn post—without payments, noisy chat, or unnecessary complexity.</p></section>
    </main>
  );
}
