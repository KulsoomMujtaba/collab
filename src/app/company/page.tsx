import { Compass, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreatorMarketplace } from "@/components/company/creator-marketplace";
import type { CreatorProfile } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyMarketplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata.role !== "company") redirect("/creator");

  const { data: account } = await supabase.from("profiles").select("full_name, onboarding_completed_at").eq("id", user.id).single();
  if (!account?.onboarding_completed_at) redirect("/onboarding/company");

  const [creatorResult, nicheResult] = await Promise.all([
    supabase.from("creator_profiles").select("workspace_id, display_name, headline, bio, country, linkedin_url, avatar_url, follower_count, average_views, post_rate_cents, currency, is_published, creator_niches(niches(name))").eq("is_published", true).order("follower_count", { ascending: false }),
    supabase.from("niches").select("name").order("name"),
  ]);
  const creators = (creatorResult.data ?? []) as unknown as CreatorProfile[];
  const niches = (nicheResult.data ?? []).map((niche) => niche.name);

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><div className="flex items-center gap-3"><p className="hidden text-sm text-muted sm:block">{account.full_name}</p><SignOutButton /></div></div></header><div className="mx-auto grid max-w-[1440px] gap-9 px-5 py-9 sm:px-8 lg:grid-cols-[210px_1fr] lg:py-12"><aside><nav className="space-y-1"><span className="flex items-center gap-3 rounded-xl bg-primary/8 px-3 py-2.5 text-sm font-semibold text-primary"><Compass size={18} /> Discover</span><span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted/50"><LayoutDashboard size={18} /> Campaigns <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-[10px]">Soon</span></span></nav><div className="mt-8 hidden rounded-2xl bg-primary p-5 text-primary-foreground lg:block"><p className="text-xs font-bold uppercase tracking-widest text-accent">Good partnerships</p><p className="mt-3 text-sm font-semibold leading-6">Start with audience fit and a clear point of view—not follower count alone.</p></div></aside><section className="min-w-0"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Creator marketplace</p><h1 className="display mt-2 text-4xl font-extrabold sm:text-5xl">Find your next collaborator.</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Explore credible B2B voices and compare the numbers that matter before you reach out.</p><div className="mt-8"><CreatorMarketplace creators={creators} niches={niches} loadError={creatorResult.error?.message ?? nicheResult.error?.message} /></div></section></div></main>;
}
