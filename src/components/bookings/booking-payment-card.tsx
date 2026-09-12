"use client";

import { CheckCircle2, Clock3, Landmark, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type BookingPayment, type BookingStatus, type PaymentStatus } from "@/lib/bookings";
import { formatRate } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const labels: Record<PaymentStatus, string> = {
  awaiting_deposit: "Awaiting deposit", held: "Funds held", released: "Payment released", received: "Payment received",
};

export function BookingPaymentCard({ bookingId, bookingStatus, viewerRole, priceCents, initialPayment }: { bookingId: string; bookingStatus: BookingStatus; viewerRole: "company" | "creator"; priceCents: number; initialPayment: BookingPayment | null }) {
  const router = useRouter();
  const [payment, setPayment] = useState(initialPayment);
  const [currentBookingStatus, setCurrentBookingStatus] = useState(bookingStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const actionable = ["accepted", "submitted", "completed"].includes(currentBookingStatus);

  async function act(action: "fund" | "undo" | "approve" | "receive") {
    setBusy(true); setError("");
    const supabase = createClient();
    const rpc = action === "fund" ? "fund_booking_payment" : action === "undo" ? "undo_booking_payment_funding" : action === "approve" ? "complete_booking" : "confirm_booking_payment_received";
    const { data, error: actionError } = await supabase.rpc(rpc, { p_booking_id: bookingId });
    if (actionError) { setError(actionError.message); setBusy(false); return; }
    const next: PaymentStatus = action === "approve" ? "released" : data as PaymentStatus;
    const now = new Date().toISOString();
    setPayment((current) => current ? {
      ...current, payment_status: next,
      funded_at: action === "fund" ? now : action === "undo" ? null : current.funded_at,
      released_at: action === "approve" ? now : current.released_at,
      received_at: action === "receive" ? now : current.received_at,
    } : current);
    if (action === "approve") setCurrentBookingStatus("completed");
    setBusy(false);
    router.refresh();
  }

  const status = payment?.payment_status;
  return <section className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Landmark size={18} className="text-primary" /><h2 className="font-bold">Payment</h2></div><p className="mt-1 text-xs text-muted">Manual escrow tracking for this collaboration.</p></div><p className="text-xl font-extrabold text-primary">{formatRate(priceCents)}</p></div>
    {payment ? <><div className="mt-5 grid grid-cols-4 gap-1.5">{(["awaiting_deposit", "held", "released", "received"] as PaymentStatus[]).map((step, index) => { const currentIndex = ["awaiting_deposit", "held", "released", "received"].indexOf(status ?? "awaiting_deposit"); return <div key={step}><div className={cn("h-1.5 rounded-full", index <= currentIndex ? "bg-primary" : "bg-border")} /><p className={cn("mt-2 hidden text-[10px] font-semibold sm:block", step === status ? "text-foreground" : "text-muted")}>{labels[step]}</p></div>; })}</div><div className="mt-5 rounded-2xl bg-surface-muted p-4"><div className="flex items-center gap-2"><PaymentIcon status={status ?? "awaiting_deposit"} /><p className="text-sm font-bold">{labels[status ?? "awaiting_deposit"]}</p></div><p className="mt-2 text-sm leading-6 text-muted">{paymentCopy(status ?? "awaiting_deposit", viewerRole)}</p>{status === "held" && payment.funded_at && <Time label="Marked deposited" value={payment.funded_at} />}{status === "released" && payment.released_at && <Time label="Released" value={payment.released_at} />}{status === "received" && payment.received_at && <Time label="Received" value={payment.received_at} />}</div>
      {actionable && <PaymentActions status={status ?? "awaiting_deposit"} bookingStatus={currentBookingStatus} viewerRole={viewerRole} busy={busy} act={act} />}</> : <div className="mt-5 rounded-2xl bg-surface-muted p-4"><div className="flex items-center gap-2 text-muted"><Clock3 size={17} /><p className="text-sm font-bold text-foreground">Not started</p></div><p className="mt-2 text-sm leading-6 text-muted">Payment tracking becomes available after the creator accepts the request.</p></div>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<div className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" /><p>Collab does not move money in this MVP. Both parties manually confirm the payment steps completed outside the platform.</p></div>
  </section>;
}

function PaymentActions({ status, bookingStatus, viewerRole, busy, act }: { status: PaymentStatus; bookingStatus: BookingStatus; viewerRole: "company" | "creator"; busy: boolean; act: (action: "fund" | "undo" | "approve" | "receive") => Promise<void> }) {
  if (viewerRole === "company" && status === "awaiting_deposit") return <button onClick={() => void act("fund")} disabled={busy} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Landmark size={16} />} Mark funds deposited</button>;
  if (viewerRole === "company" && status === "held" && bookingStatus === "accepted") return <button onClick={() => void act("undo")} disabled={busy} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCcw size={15} />} Undo deposited status</button>;
  if (viewerRole === "company" && status === "held" && bookingStatus === "submitted") return <button onClick={() => void act("approve")} disabled={busy} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve work & release payment</button>;
  if (viewerRole === "creator" && status === "released") return <button onClick={() => void act("receive")} disabled={busy} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm payment received</button>;
  return null;
}

function PaymentIcon({ status }: { status: PaymentStatus }) { return status === "received" ? <CheckCircle2 size={17} className="text-success" /> : status === "held" ? <ShieldCheck size={17} className="text-primary" /> : <Clock3 size={17} className="text-primary" />; }
function Time({ label, value }: { label: string; value: string }) { return <p className="mt-2 text-xs text-muted">{label} {new Date(value).toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p>; }
function paymentCopy(status: PaymentStatus, role: "company" | "creator") {
  if (status === "awaiting_deposit") return role === "company" ? "Mark the agreed fee as deposited once it has been moved outside Collab." : "The company needs to mark the agreed fee as deposited before you can deliver.";
  if (status === "held") return role === "company" ? "Funds are marked as held. Review the deliverable when the creator submits it." : "Funds are marked as held. You can now submit the agreed deliverable.";
  if (status === "released") return role === "company" ? "The approved deliverable released payment to the creator." : "The company approved your work and marked payment as released.";
  return "The creator has confirmed receiving the payment.";
}
