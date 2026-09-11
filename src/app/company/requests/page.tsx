import { Compass, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CompanyRequestList } from "@/components/bookings/company-request-list";
import type { CompanyBooking } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata.role !== "company") redirect("/creator");
  const [{ data, error }, { data: account }] = await Promise.all([
    supabase.rpc("get_company_booking_outbox"),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);
  const bookings = (data ?? []) as CompanyBooking[];

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><div className="flex items-center gap-3"><p className="hidden text-sm text-muted sm:block">{account?.full_name}</p><SignOutButton /></div></div></header><div className="mx-auto grid max-w-[1440px] gap-9 px-5 py-10 sm:px-8 lg:grid-cols-[210px_1fr] lg:py-12"><aside><nav className="space-y-1"><Link href="/company" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground"><Compass size={18} /> Discover</Link><span className="flex items-center gap-3 rounded-xl bg-primary/8 px-3 py-2.5 text-sm font-semibold text-primary"><LayoutDashboard size={18} /> Requests</span></nav></aside><section className="min-w-0"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Campaigns</p><h1 className="display mt-2 text-4xl font-extrabold sm:text-5xl">Your collaboration requests</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Keep track of every brief and see when a creator is ready to collaborate.</p><div className="mt-8"><CompanyRequestList bookings={bookings} loadError={error?.message} /></div></section></div></main>;
}
