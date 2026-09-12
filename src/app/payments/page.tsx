import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PaymentOverviewList } from "@/components/workspace/payment-overview-list";
import { WorkspaceNav } from "@/components/workspace/workspace-nav";
import type { CollaborationOverview } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = user.user_metadata.role === "creator" ? "creator" : user.user_metadata.role === "company" ? "company" : null;
  if (!role) redirect("/login");

  const [{ data, error }, { data: account }] = await Promise.all([
    supabase.rpc("get_collaboration_overview"),
    supabase.from("profiles").select("full_name, onboarding_completed_at").eq("id", user.id).single(),
  ]);
  if (!account?.onboarding_completed_at) redirect(`/onboarding/${role}`);
  const items = (data ?? []) as CollaborationOverview[];

  return <main className="min-h-screen bg-background">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><div className="flex items-center gap-3"><p className="hidden text-sm text-muted sm:block">{account.full_name}</p><SignOutButton /></div></div></header>
    <div className="mx-auto grid max-w-[1440px] gap-9 px-5 py-10 sm:px-8 lg:grid-cols-[210px_1fr] lg:py-12">
      <WorkspaceNav role={role} active="payments" />
      <section className="min-w-0"><PaymentOverviewList initialItems={items} role={role} loadError={error?.message} /></section>
    </div>
  </main>;
}
