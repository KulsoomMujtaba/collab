"use client";

import { CalendarDays, Check, CheckCircle2, ChevronDown, ExternalLink, LoaderCircle, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/bookings/status-badge";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { createClient } from "@/lib/supabase/client";
import { bookingFilters, formatBookingDate, type BookingStatus, type CreatorBooking } from "@/lib/bookings";
import { formatRate } from "@/lib/creator-profile";
import { cn } from "@/lib/utils";

export function CreatorRequestInbox({ initialBookings, loadError }: { initialBookings: CreatorBooking[]; loadError?: string }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [busyId, setBusyId] = useState("");
  const [confirmDecline, setConfirmDecline] = useState("");
  const [actionError, setActionError] = useState("");
  const visible = useMemo(() => filter === "all" ? bookings : bookings.filter((booking) => booking.booking_status === filter), [bookings, filter]);

  async function decide(bookingId: string, decision: "accepted" | "declined") {
    setBusyId(bookingId); setActionError("");
    const { error } = await createClient().rpc("respond_to_booking", { p_booking_id: bookingId, p_decision: decision });
    if (error) { setActionError(error.message); setBusyId(""); return; }
    setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? { ...booking, booking_status: decision, payment_status: decision === "accepted" ? "awaiting_deposit" : booking.payment_status, responded_at: new Date().toISOString() } : booking));
    setBusyId(""); setConfirmDecline(""); router.refresh();
  }

  async function confirmPaymentReceived(bookingId: string) {
    setBusyId(bookingId); setActionError("");
    const { error } = await createClient().rpc("confirm_booking_payment_received", { p_booking_id: bookingId });
    if (error) { setActionError(error.message); setBusyId(""); return; }
    setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? { ...booking, payment_status: "received" } : booking));
    setBusyId(""); router.refresh();
  }

  if (loadError) return <EmptyState title="Requests couldn't be loaded" description="Refresh the page to try connecting again." />;
  return <>
    <div className="flex gap-2 overflow-x-auto pb-2">{bookingFilters.map((item) => { const count = item.value === "all" ? bookings.length : bookings.filter((booking) => booking.booking_status === item.value).length; return <button key={item.value} onClick={() => setFilter(item.value)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold", filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40")}>{item.label} <span className="ml-1 opacity-70">{count}</span></button>; })}</div>
    {actionError && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
    {visible.length ? <div className="mt-6 space-y-4">{visible.map((booking) => <article key={booking.booking_id} className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={booking.booking_status} />{booking.payment_status && <PaymentStatusBadge status={booking.payment_status} />}<span className="text-xs text-muted">Received {new Date(booking.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}</span></div><h2 className="display mt-3 text-2xl font-extrabold">{booking.campaign_title}</h2><p className="mt-1 text-sm font-semibold text-muted">From {booking.company_name}</p></div><div className="sm:text-right"><p className="text-xs text-muted">Creator fee</p><p className="mt-1 text-xl font-extrabold text-primary">{formatRate(booking.price_cents)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:justify-end"><CalendarDays size={14} />{formatBookingDate(booking.desired_publish_date)}</p></div></div>
      <details className="group mt-5 border-t border-border pt-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">View campaign brief <ChevronDown size={17} className="transition group-open:rotate-180" /></summary><div className="mt-5 grid gap-5 text-sm leading-6 sm:grid-cols-2"><Detail label="Objective" value={booking.campaign_objective} /><Detail label="Requested deliverable" value={booking.deliverable_description} />{booking.company_notes && <Detail label="Additional notes" value={booking.company_notes} />}</div></details>
      {booking.booking_status === "pending" && <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">{confirmDecline === booking.booking_id ? <div className="flex flex-1 flex-col gap-3 rounded-2xl bg-destructive/5 p-4 sm:flex-row sm:items-center"><p className="mr-auto text-sm font-semibold">Decline this request? This can&apos;t be undone.</p><button onClick={() => setConfirmDecline("")} className="text-sm font-semibold text-muted">Keep request</button><button onClick={() => void decide(booking.booking_id, "declined")} disabled={busyId === booking.booking_id} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-white disabled:opacity-60">{busyId === booking.booking_id ? <LoaderCircle size={16} className="animate-spin" /> : <X size={16} />} Decline</button></div> : <><button onClick={() => setConfirmDecline(booking.booking_id)} className="h-11 rounded-full border border-border px-5 text-sm font-semibold hover:bg-surface-muted">Decline</button><button onClick={() => void decide(booking.booking_id, "accepted")} disabled={busyId === booking.booking_id} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busyId === booking.booking_id ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />} Accept request</button></>}</div>}
      {booking.booking_status === "accepted" && booking.payment_status === "held" && <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4"><p className="text-sm font-bold">Funds are held — you can deliver</p><p className="mt-1 text-sm leading-6 text-muted">Open the collaboration to submit your public LinkedIn post.</p><Link href={`/bookings/${booking.booking_id}`} className="mt-3 inline-flex text-sm font-bold text-primary hover:underline">Submit deliverable</Link></div>}
      {booking.booking_status === "accepted" && booking.payment_status !== "held" && <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-4"><p className="text-sm font-bold">Waiting for funds to be held</p><p className="mt-1 text-sm leading-6 text-muted">The company needs to mark the agreed fee as deposited before you can submit the deliverable.</p><Link href={`/bookings/${booking.booking_id}`} className="mt-3 inline-flex text-sm font-bold text-primary hover:underline">View payment status</Link></div>}
      {(booking.booking_status === "submitted" || booking.booking_status === "completed") && booking.deliverable_public_url && <DeliverableState booking={booking} />}
      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><Link href={`/bookings/${booking.booking_id}`} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"><MessageCircle size={16} />{["accepted", "submitted", "completed"].includes(booking.booking_status) ? "Open collaboration" : "View booking details"}</Link>{booking.booking_status === "completed" && booking.payment_status === "released" && <button onClick={() => void confirmPaymentReceived(booking.booking_id)} disabled={busyId === booking.booking_id} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{busyId === booking.booking_id ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm payment received</button>}</div>
    </article>)}</div> : <EmptyState title={bookings.length ? "No requests in this view" : "No collaboration requests yet"} description={bookings.length ? "Choose another status to see your requests." : "When a company wants to work with you, their brief will appear here."} />}
  </>;
}

function DeliverableState({ booking }: { booking: CreatorBooking }) {
  const complete = booking.booking_status === "completed";
  return <div className={cn("mt-6 rounded-2xl border p-4", complete ? "border-primary/15 bg-primary/5" : "border-[#315ea8]/15 bg-[#eaf1ff]/60")}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">{complete ? "Collaboration complete" : "Post submitted"}</p><p className="mt-1 text-sm text-muted">{complete ? "The company has confirmed your deliverable." : "The company can now review and confirm completion."}</p></div><a href={booking.deliverable_public_url ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">View LinkedIn post <ExternalLink size={15} /></a></div></div>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-1 whitespace-pre-line text-foreground">{value}</p></div>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><h2 className="display text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>; }
