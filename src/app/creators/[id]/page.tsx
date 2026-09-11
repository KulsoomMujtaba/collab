import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorProfileCard } from "@/components/creator/profile-card";
import { RequestCollaborationPanel } from "@/components/bookings/request-collaboration-panel";
import { createClient } from "@/lib/supabase/server";
import { formatRate, type CreatorProfile } from "@/lib/creator-profile";

async function getCreator(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("creator_profiles").select("workspace_id, display_name, headline, bio, country, linkedin_url, avatar_url, follower_count, average_views, post_rate_cents, currency, is_published, creator_niches(niches(name))").eq("workspace_id", id).maybeSingle();
  return data as unknown as CreatorProfile | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const profile = await getCreator((await params).id);
  return profile ? { title: `${profile.display_name} — Collab`, description: `${profile.headline}. Discover this B2B creator on Collab.` } : { title: "Creator not found — Collab" };
}

export default async function PublicCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getCreator((await params).id);
  if (!profile) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isCompany = user?.user_metadata.role === "company";
  const backHref = isCompany ? "/company" : "/";
  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link>{isCompany ? <Link href="/company" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-surface-muted">Company workspace</Link> : <Link href="/signup" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Join Collab</Link>}</div></header><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"><Link href={backHref} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft size={16} /> Back to creators</Link><CreatorProfileCard profile={profile} publicView />{isCompany ? <div className="mt-5 flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="font-bold">Think {profile.display_name} is a fit?</p><p className="mt-1 text-sm text-muted">Share a clear brief without leaving this profile.</p></div><RequestCollaborationPanel creatorWorkspaceId={profile.workspace_id} creatorName={profile.display_name} rate={formatRate(profile.post_rate_cents)} /></div> : !user ? <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center"><p className="text-sm text-muted"><strong className="text-foreground">Want to work with {profile.display_name}?</strong><br />Sign in as a company to send a collaboration request.</p><Link href="/login" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Sign in to request</Link></div> : null}<div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-sm leading-6 text-muted"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" /><p><strong className="text-foreground">Clear terms from the start.</strong> This creator&apos;s listed rate covers one sponsored LinkedIn post. Campaign requests and final details are agreed before work begins.</p></div></div></main>;
}
