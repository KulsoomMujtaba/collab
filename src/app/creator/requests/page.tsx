import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreatorRequestInbox } from "@/components/bookings/creator-request-inbox";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import type { CreatorBooking } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata.role !== "creator") redirect("/company");
  const { data, error } = await supabase.rpc("get_creator_booking_inbox");
  const bookings = (data ?? []) as CreatorBooking[];

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><SignOutButton /></div></header><div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 lg:grid-cols-[210px_1fr] lg:py-12"><WorkspaceNav role="creator" active="requests" /><section className="min-w-0"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Opportunities</p><h1 className="display mt-2 text-4xl font-extrabold sm:text-5xl">Collaboration requests</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Review each brief and decide whether it&apos;s the right fit for you and your audience.</p><div className="mt-8"><CreatorRequestInbox initialBookings={bookings} loadError={error?.message} /></div></section></div></main>;
}
