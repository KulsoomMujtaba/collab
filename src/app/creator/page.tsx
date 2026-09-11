import { ArrowUpRight, Edit3, Eye, LayoutDashboard, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatorProfileCard } from "@/components/creator/profile-card";
import { PublishControl } from "@/components/creator/publish-control";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile } from "@/lib/creator-profile";

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata.role !== "creator") redirect("/onboarding/company");

  const { data: account } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", user.id).single();
  if (!account?.onboarding_completed_at) redirect("/onboarding/creator");

  const { data, error } = await supabase.from("creator_profiles").select("workspace_id, display_name, headline, bio, country, linkedin_url, avatar_url, follower_count, average_views, post_rate_cents, currency, is_published, creator_niches(niches(name))").eq("user_id", user.id).single();
  if (error || !data) redirect("/onboarding/creator");
  const profile = data as unknown as CreatorProfile;

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><div className="flex items-center gap-1"><Link href={`/creators/${profile.workspace_id}`} className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground sm:inline-flex"><Eye size={16} /> Public profile</Link><SignOutButton /></div></div></header><div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[210px_1fr] lg:py-12"><aside><nav className="space-y-1"><span className="flex items-center gap-3 rounded-xl bg-primary/8 px-3 py-2.5 text-sm font-semibold text-primary"><LayoutDashboard size={18} /> Overview</span><Link href="/onboarding/creator" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground"><UserRound size={18} /> Edit profile</Link></nav></aside><section><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Creator workspace</p><h1 className="display mt-2 text-4xl font-extrabold">Your Collab profile</h1><p className="mt-2 text-muted">Keep your details current and control when companies can discover you.</p></div><span className={profile.is_published ? "inline-flex w-fit items-center gap-2 rounded-full bg-[#e9f7f0] px-3 py-1.5 text-xs font-bold text-success" : "inline-flex w-fit items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-xs font-bold text-muted"}><span className={profile.is_published ? "h-2 w-2 rounded-full bg-success" : "h-2 w-2 rounded-full bg-muted"} />{profile.is_published ? "Live in marketplace" : "Private draft"}</span></div><div className="mt-9 rounded-2xl border border-border bg-surface p-5 sm:flex sm:items-center sm:justify-between"><div><p className="font-bold">{profile.is_published ? "Your profile is visible" : "Ready to meet the right companies?"}</p><p className="mt-1 text-sm text-muted">{profile.is_published ? "Companies can discover and review your profile." : "Publish when you're happy with how everything looks."}</p></div><div className="mt-4 sm:mt-0"><PublishControl published={profile.is_published} /></div></div><div className="mt-7"><CreatorProfileCard profile={profile} /></div><div className="mt-6 flex flex-wrap gap-3"><Link href="/onboarding/creator" className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-muted"><Edit3 size={16} /> Edit profile</Link><Link href={`/creators/${profile.workspace_id}`} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-primary hover:bg-primary/5">View public page <ArrowUpRight size={16} /></Link></div></section></div></main>;
}
