"use client";

import { ArrowRight, CheckCircle2, Landmark, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { StatusBadge } from "@/components/bookings/status-badge";
import { type CollaborationOverview, type PaymentStatus } from "@/lib/bookings";
import { formatRate } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const filters: Array<{ value: "all" | PaymentStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "awaiting_deposit", label: "Awaiting deposit" },
  { value: "held", label: "Held" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
];

export function PaymentOverviewList({ initialItems, role, loadError }: { initialItems: CollaborationOverview[]; role: "company" | "creator"; loadError?: string }) {
  const [items, setItems] = useState(initialItems.filter((item) => item.payment_status));
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.payment_status === filter), [filter, items]);

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
  if (!items.length) return <Empty title="No payments to track yet" description="A payment tracker is created when a creator accepts a request." />;

  return <>
    <div className="flex gap-2 overflow-x-auto pb-2">{filters.map((item) => { const count = item.value === "all" ? items.length : items.filter((payment) => payment.payment_status === item.value).length; return <button key={item.value} onClick={() => setFilter(item.value)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold", filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40")}>{item.label} <span className="ml-1 opacity-70">{count}</span></button>; })}</div>
    {actionError && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
    {visible.length ? <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface card-shadow">{visible.map((item, index) => {
      const canFund = role === "company" && item.booking_status === "accepted" && item.payment_status === "awaiting_deposit";
      const canConfirm = role === "creator" && item.booking_status === "completed" && item.payment_status === "released";
      return <article key={item.booking_id} className={cn("grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center", index > 0 && "border-t border-border")}>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><PaymentStatusBadge status={item.payment_status!} /><StatusBadge status={item.booking_status} /></div><h2 className="display mt-2 truncate text-xl font-extrabold">{item.campaign_title}</h2><p className="mt-1 truncate text-sm text-muted">{role === "company" ? "Creator" : "Company"}: <span className="font-semibold text-foreground">{item.counterpart_name}</span></p><p className="mt-2 text-xs text-muted">{paymentTiming(item)}</p></div>
        <div className="md:text-right"><p className="text-xs text-muted">Tracked fee</p><p className="mt-1 text-lg font-extrabold text-primary">{formatRate(item.price_cents)}</p></div>
        <div className="flex md:justify-end">{canFund || canConfirm ? <button onClick={() => void advance(item)} disabled={busyId === item.booking_id} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busyId === item.booking_id ? <LoaderCircle size={16} className="animate-spin" /> : canFund ? <Landmark size={16} /> : <CheckCircle2 size={16} />}{canFund ? "Mark funds deposited" : "Confirm payment received"}</button> : <Link href={`/bookings/${item.booking_id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">View collaboration <ArrowRight size={16} /></Link>}</div>
      </article>;
    })}</div> : <Empty title="No payments in this view" description="Choose another status to see tracked payments." />}
  </>;
}

function paymentTiming(item: CollaborationOverview) {
  const timestamp = item.payment_received_at ?? item.payment_released_at ?? item.payment_funded_at;
  if (!timestamp) return "Waiting for the company to mark funds as deposited";
  const labels: Record<PaymentStatus, string> = { awaiting_deposit: "Awaiting deposit", held: "Funds marked held", released: "Payment marked released", received: "Receipt confirmed" };
  return `${labels[item.payment_status!]} ${new Date(timestamp).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}`;
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><h2 className="display text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}
