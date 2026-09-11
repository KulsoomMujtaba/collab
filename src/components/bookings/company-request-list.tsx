"use client";

import { CalendarDays, CheckCircle2, ChevronDown, ExternalLink, LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/bookings/status-badge";
import { createClient } from "@/lib/supabase/client";
import { bookingFilters, formatBookingDate, type BookingStatus, type CompanyBooking } from "@/lib/bookings";
import { formatRate, initials } from "@/lib/creator-profile";
import { cn } from "@/lib/utils";

export function CompanyRequestList({ bookings: initialBookings, loadError }: { bookings: CompanyBooking[]; loadError?: string }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [confirmingId, setConfirmingId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const visible = useMemo(() => filter === "all" ? bookings : bookings.filter((booking) => booking.booking_status === filter), [bookings, filter]);

  async function complete(bookingId: string) {
    setBusyId(bookingId); setActionError("");
    const { error } = await createClient().rpc("complete_booking", { p_booking_id: bookingId });
    if (error) { setActionError(error.message); setBusyId(""); return; }
    setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? { ...booking, booking_status: "completed", completed_at: new Date().toISOString() } : booking));
    setBusyId(""); setConfirmingId(""); router.refresh();
  }

  if (loadError) return <Empty title="Requests couldn't be loaded" description="Refresh the page to try again." />;
  return <>
    <div className="flex gap-2 overflow-x-auto pb-2">{bookingFilters.map((item) => { const count = item.value === "all" ? bookings.length : bookings.filter((booking) => booking.booking_status === item.value).length; return <button key={item.value} onClick={() => setFilter(item.value)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold", filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/40")}>{item.label} <span className="ml-1 opacity-70">{count}</span></button>; })}</div>
    {actionError && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
    {visible.length ? <div className="mt-6 space-y-4">{visible.map((booking) => <article key={booking.booking_id} className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-sm font-extrabold text-primary">{booking.creator_avatar_url ? <Image unoptimized width={48} height={48} src={booking.creator_avatar_url} alt="" className="h-full w-full object-cover" /> : initials(booking.creator_name)}</div><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={booking.booking_status} /><span className="text-xs text-muted">Sent {new Date(booking.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}</span></div><h2 className="display mt-2 text-xl font-extrabold">{booking.campaign_title}</h2><Link href={`/creators/${booking.creator_workspace_id}`} className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">{booking.creator_name}</Link><p className="text-xs text-muted">{booking.creator_headline}</p></div></div><div className="pl-16 sm:pl-0 sm:text-right"><p className="text-lg font-extrabold text-primary">{formatRate(booking.price_cents)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:justify-end"><CalendarDays size={14} />{formatBookingDate(booking.desired_publish_date)}</p></div></div>
      <details className="group mt-5 border-t border-border pt-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">View request details <ChevronDown size={17} className="transition group-open:rotate-180" /></summary><div className="mt-5 grid gap-5 text-sm leading-6 sm:grid-cols-2"><Detail label="Objective" value={booking.campaign_objective} /><Detail label="Requested deliverable" value={booking.deliverable_description} />{booking.company_notes && <Detail label="Your notes" value={booking.company_notes} />}</div></details>
      {(booking.booking_status === "submitted" || booking.booking_status === "completed") && booking.deliverable_public_url && <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">{booking.booking_status === "completed" ? "Collaboration complete" : "Deliverable ready for review"}</p><p className="mt-1 text-sm text-muted">{booking.booking_status === "completed" ? "You confirmed this creator's work." : "Open the LinkedIn post before confirming completion."}</p></div><a href={booking.deliverable_public_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">View LinkedIn post <ExternalLink size={15} /></a></div>{booking.booking_status === "submitted" && <div className="mt-4 border-t border-primary/10 pt-4">{confirmingId === booking.booking_id ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><p className="mr-auto text-sm font-semibold">Confirm that the deliverable is complete?</p><button onClick={() => setConfirmingId("")} className="text-sm font-semibold text-muted">Not yet</button><button onClick={() => void complete(booking.booking_id)} disabled={busyId === booking.booking_id} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busyId === booking.booking_id ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm completion</button></div> : <button onClick={() => setConfirmingId(booking.booking_id)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"><CheckCircle2 size={16} /> Confirm completion</button>}</div>}</div>}
    </article>)}</div> : <Empty title={bookings.length ? "No requests in this view" : "No requests sent yet"} description={bookings.length ? "Choose another status to see your requests." : "Discover a creator and send a campaign brief to start collaborating."} />}
  </>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-1 whitespace-pre-line">{value}</p></div>; }
function Empty({ title, description }: { title: string; description: string }) { return <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><h2 className="display text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>; }
