"use client";

import { ArrowRight, Banknote, CheckCircle2, CircleDollarSign, Clock3, Landmark, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/bookings/status-badge";
import { type CollaborationOverview, type PaymentStatus } from "@/lib/bookings";
import { formatRate } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const stages: Array<{ status: PaymentStatus; label: string; description: string; icon: typeof Clock3; tone: string; rail: string }> = [
  { status: "awaiting_deposit", label: "Awaiting deposit", description: "Not yet funded", icon: Clock3, tone: "bg-accent/35 text-primary", rail: "bg-accent" },
  { status: "held", label: "Funds held", description: "Ready for delivery", icon: ShieldCheck, tone: "bg-primary/8 text-primary", rail: "bg-primary" },
  { status: "released", label: "Released", description: "Sent to creator", icon: Banknote, tone: "bg-surface-muted text-primary", rail: "bg-muted" },
  { status: "received", label: "Received", description: "Fully settled", icon: CheckCircle2, tone: "bg-success/10 text-success", rail: "bg-success" },
];

export function PaymentOverviewList({ initialItems, role, loadError }: { initialItems: CollaborationOverview[]; role: "company" | "creator"; loadError?: string }) {
  const [items, setItems] = useState(initialItems.filter((item) => item.payment_status));
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.payment_status === filter), [filter, items]);
  const trackedValue = items.reduce((sum, item) => sum + item.price_cents, 0);
  const heldValue = items.filter((item) => item.payment_status === "held").reduce((sum, item) => sum + item.price_cents, 0);
  const needsAction = items.filter((item) => role === "company" ? canCompanyFund(item) : canCreatorConfirm(item)).length;

  async function advance(item: CollaborationOverview) {
    const rpc = role === "company" ? "fund_booking_payment" : "confirm_booking_payment_received";
    setBusyId(item.booking_id); setActionError("");
    const { error } = await createClient().rpc(rpc, { p_booking_id: item.booking_id });
    if (error) { setActionError(error.message); setBusyId(""); return; }
    const nextStatus: PaymentStatus = role === "company" ? "held" : "received";
    const now = new Date().toISOString();
    setItems((current) => current.map((entry) => entry.booking_id === item.booking_id ? { ...entry, payment_status: nextStatus, payment_funded_at: role === "company" ? now : entry.payment_funded_at, payment_received_at: role === "creator" ? now : entry.payment_received_at } : entry));
    setBusyId("");
  }

  if (loadError) return <Empty title="Payments couldn't be loaded" description="Refresh the page to try connecting again." />;

  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-[0_24px_60px_rgba(70,29,41,0.18)] sm:p-8">
      <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[36px] border-accent/10" aria-hidden="true" />
      <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-accent"><WalletCards size={14} /> Manual payment workspace</span><h1 className="display mt-5 max-w-2xl text-4xl font-extrabold sm:text-5xl">Know where every payment stands.</h1><p className="mt-3 max-w-xl leading-7 text-primary-foreground/70">Collab records the handoff between company and creator. Funds continue to move outside the platform.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Tracked value" value={formatRate(trackedValue)} />
          <Metric label="Held now" value={formatRate(heldValue)} />
          <Metric label="Needs you" value={String(needsAction)} className="col-span-2 sm:col-span-1" />
        </div>
      </div>
    </section>

    {items.length ? <>
      <section><div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Payment pipeline</p><h2 className="display mt-1 text-2xl font-extrabold">Follow the money</h2></div><button onClick={() => setFilter("all")} className={cn("w-fit text-sm font-bold hover:underline", filter === "all" ? "text-primary" : "text-muted")}>View all {items.length}</button></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stages.map((stage) => { const stageItems = items.filter((item) => item.payment_status === stage.status); const Icon = stage.icon; return <button key={stage.status} aria-pressed={filter === stage.status} onClick={() => setFilter(filter === stage.status ? "all" : stage.status)} className={cn("rounded-2xl border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35", filter === stage.status ? "border-primary ring-2 ring-primary/10" : "border-border")}><div className="flex items-center justify-between"><span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stage.tone)}><Icon size={17} /></span><span className="text-xs font-bold text-muted">{stageItems.length} {stageItems.length === 1 ? "payment" : "payments"}</span></div><p className="mt-4 font-bold">{stage.label}</p><p className="mt-1 text-xs text-muted">{stage.description}</p><p className="mt-3 text-lg font-extrabold text-primary">{formatRate(stageItems.reduce((sum, item) => sum + item.price_cents, 0))}</p></button>; })}</div>
      </section>

      <section><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Payment activity</p><h2 className="display mt-1 text-2xl font-extrabold">{filter === "all" ? "All tracked payments" : stages.find((stage) => stage.status === filter)?.label}</h2></div>
        {actionError && <p role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
        {visible.length ? <div className="space-y-3">{visible.map((item) => <PaymentRow key={item.booking_id} item={item} role={role} busy={busyId === item.booking_id} onAdvance={advance} />)}</div> : <Empty title="No payments in this stage" description="Choose another stage or view all tracked payments." />}
      </section>
    </> : <Empty title="No payments to track yet" description="A payment tracker is created when a creator accepts a request." />}
  </div>;
}

function PaymentRow({ item, role, busy, onAdvance }: { item: CollaborationOverview; role: "company" | "creator"; busy: boolean; onAdvance: (item: CollaborationOverview) => Promise<void> }) {
  const stage = stages.find((candidate) => candidate.status === item.payment_status)!;
  const Icon = stage.icon;
  const canFund = role === "company" && canCompanyFund(item);
  const canConfirm = role === "creator" && canCreatorConfirm(item);
  return <article className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/25 hover:shadow-[0_14px_40px_rgba(70,29,41,0.07)]">
    <span className={cn("absolute inset-y-0 left-0 w-1", stage.rail)} aria-hidden="true" />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="flex min-w-0 gap-4"><span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", stage.tone)}><Icon size={19} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{stage.label}</p><StatusBadge status={item.booking_status} /></div><h3 className="display mt-1 truncate text-xl font-extrabold">{item.campaign_title}</h3><p className="mt-1 truncate text-sm text-muted">{role === "company" ? "Creator" : "Company"}: <span className="font-semibold text-foreground">{item.counterpart_name}</span></p><p className="mt-2 text-xs text-muted">{paymentTiming(item)}</p></div></div>
      <div className="lg:min-w-28 lg:text-right"><p className="text-xs text-muted">Collaboration fee</p><p className="mt-1 text-xl font-extrabold text-primary">{formatRate(item.price_cents)}</p></div>
      <div className="flex flex-wrap items-center gap-3 lg:min-w-48 lg:justify-end">{canFund || canConfirm ? <button onClick={() => void onAdvance(item)} disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : canFund ? <Landmark size={16} /> : <CircleDollarSign size={16} />}{canFund ? "Mark deposited" : "Confirm received"}</button> : null}<Link href={`/bookings/${item.booking_id}`} aria-label={`Open ${item.campaign_title} collaboration`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary hover:bg-surface-muted"><ArrowRight size={17} /></Link></div>
    </div>
  </article>;
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return <div className={cn("min-w-32 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/8 p-4", className)}><p className="text-xs font-semibold text-primary-foreground/65">{label}</p><p className="mt-2 text-xl font-extrabold text-primary-foreground">{value}</p></div>;
}

function canCompanyFund(item: CollaborationOverview) { return item.booking_status === "accepted" && item.payment_status === "awaiting_deposit"; }
function canCreatorConfirm(item: CollaborationOverview) { return item.booking_status === "completed" && item.payment_status === "released"; }

function paymentTiming(item: CollaborationOverview) {
  const timestamp = item.payment_received_at ?? item.payment_released_at ?? item.payment_funded_at;
  if (!timestamp) return "Waiting for the company to mark funds as deposited";
  const labels: Record<PaymentStatus, string> = { awaiting_deposit: "Awaiting deposit since", held: "Funds marked held", released: "Payment marked released", received: "Receipt confirmed" };
  return `${labels[item.payment_status!]} ${new Date(timestamp).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}`;
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><h2 className="display text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}
