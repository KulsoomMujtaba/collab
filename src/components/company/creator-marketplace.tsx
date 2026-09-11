"use client";

import { ArrowUpRight, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { creatorNiches, formatCount, formatRate, initials, type CreatorProfile } from "@/lib/creator-profile";
import { cn } from "@/lib/utils";

export function CreatorMarketplace({ creators, niches, loadError }: { creators: CreatorProfile[]; niches: string[]; loadError?: string }) {
  const [query, setQuery] = useState("");
  const [activeNiche, setActiveNiche] = useState("All creators");

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return creators.filter((creator) => {
      const names = creatorNiches(creator);
      const matchesNiche = activeNiche === "All creators" || names.includes(activeNiche);
      const matchesSearch = !search || creator.display_name.toLowerCase().includes(search) || creator.headline.toLowerCase().includes(search);
      return matchesNiche && matchesSearch;
    });
  }, [activeNiche, creators, query]);

  function clearFilters() { setQuery(""); setActiveNiche("All creators"); }

  return <>
    <div className="rounded-3xl border border-border bg-surface p-4 card-shadow sm:p-6">
      <div className="relative"><Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search creators" placeholder="Search by creator name or headline" className="h-13 w-full rounded-2xl border border-border bg-background pl-12 pr-12 text-[15px] outline-none transition placeholder:text-muted/65 focus:border-primary focus:ring-3 focus:ring-primary/10" />{query && <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-surface-muted"><X size={17} /></button>}</div>
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1"><span className="mr-1 flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted"><SlidersHorizontal size={15} /> Niche</span>{["All creators", ...niches].map((niche) => <button key={niche} onClick={() => setActiveNiche(niche)} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition", activeNiche === niche ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40")}>{niche}</button>)}</div>
    </div>

    <div className="mt-8 flex items-center justify-between"><p className="text-sm text-muted"><strong className="text-foreground">{results.length}</strong> {results.length === 1 ? "creator" : "creators"} found</p>{(query || activeNiche !== "All creators") && <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">Clear filters</button>}</div>

    {loadError ? <MarketplaceMessage title="We couldn't load creators" description="The marketplace had trouble connecting. Refresh the page to try again." /> : results.length === 0 ? <MarketplaceMessage title={creators.length ? "No exact matches" : "The marketplace is warming up"} description={creators.length ? "Try a broader search or choose another niche." : "Published creator profiles will appear here. Check back soon."} clear={creators.length ? clearFilters : undefined} /> : <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.map((creator) => <CreatorCard key={creator.workspace_id} creator={creator} />)}</div>}
  </>;
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const niches = creatorNiches(creator);
  return <Link href={`/creators/${creator.workspace_id}`} className="group flex min-h-[390px] flex-col overflow-hidden rounded-3xl border border-border bg-surface transition duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><div className="h-20 bg-gradient-to-br from-primary to-primary-hover" /><div className="flex flex-1 flex-col px-6 pb-6"><div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-accent text-base font-extrabold text-primary">{creator.avatar_url ? <Image unoptimized width={64} height={64} src={creator.avatar_url} alt={`${creator.display_name}'s profile`} className="h-full w-full object-cover" /> : initials(creator.display_name)}</div><h2 className="display mt-5 text-2xl font-extrabold group-hover:text-primary">{creator.display_name}</h2><p className="mt-1 min-h-12 text-sm leading-6 text-muted">{creator.headline}</p><div className="mt-4 flex min-h-7 flex-wrap gap-1.5">{niches.slice(0, 2).map((niche) => <span key={niche} className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-primary">{niche}</span>)}{niches.length > 2 && <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-muted">+{niches.length - 2}</span>}</div><dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5"><div><dt className="text-xs text-muted">Followers</dt><dd className="mt-1 font-bold">{formatCount(creator.follower_count)}</dd></div><div><dt className="text-xs text-muted">Avg. views</dt><dd className="mt-1 font-bold">{formatCount(creator.average_views)}</dd></div><div><dt className="text-xs text-muted">Post rate</dt><dd className="mt-1 text-lg font-extrabold text-primary">{formatRate(creator.post_rate_cents)}</dd></div><div className="flex items-end justify-end"><span className="inline-flex items-center gap-1 text-sm font-bold text-primary">View profile <ArrowUpRight size={15} /></span></div></dl></div></Link>;
}

function MarketplaceMessage({ title, description, clear }: { title: string; description: string; clear?: () => void }) {
  return <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary"><Sparkles size={22} /></div><h2 className="display mt-4 text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>{clear && <button onClick={clear} className="mt-5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-muted">Clear filters</button>}</div>;
}
