import { ArrowLeft, CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingMessageThread } from "@/components/bookings/booking-message-thread";
import { BookingPaymentCard } from "@/components/bookings/booking-payment-card";
import { StatusBadge } from "@/components/bookings/status-badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { formatBookingDate, type BookingDetail, type BookingMessage, type BookingPayment } from "@/lib/bookings";
import { formatRate } from "@/lib/creator-profile";
import { createClient } from "@/lib/supabase/server";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/bookings/${id}`);

  const [{ data: detailData, error: detailError }, { data: messageData }, { data: paymentData }] = await Promise.all([
    supabase.rpc("get_booking_detail", { p_booking_id: id }).maybeSingle(),
    supabase.rpc("get_booking_messages", { p_booking_id: id }),
    supabase.rpc("get_booking_payment", { p_booking_id: id }),
  ]);
  if (detailError || !detailData) notFound();
  const booking = detailData as BookingDetail;
  const messages = (messageData ?? []) as BookingMessage[];
  const payment = (paymentData?.[0] ?? null) as BookingPayment | null;
  const backHref = booking.viewer_role === "company" ? "/company/requests" : "/creator/requests";
  const counterpart = booking.viewer_role === "company" ? booking.creator_name : booking.company_name;

  return <main className="min-h-screen bg-background"><header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><SignOutButton /></div></header><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12"><Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft size={16} /> Back to requests</Link><div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-3"><StatusBadge status={booking.booking_status} /><span className="text-sm text-muted">With {counterpart}</span></div><h1 className="display mt-3 text-4xl font-extrabold sm:text-5xl">{booking.campaign_title}</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Everything agreed for this collaboration, including its shared conversation.</p></div><div className="sm:text-right"><p className="text-xs text-muted">Creator fee</p><p className="mt-1 text-2xl font-extrabold text-primary">{formatRate(booking.price_cents)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:justify-end"><CalendarDays size={14} /> {formatBookingDate(booking.desired_publish_date)}</p></div></div><div className="mt-9 grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]"><div className="space-y-6"><section className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-7"><h2 className="font-bold">Campaign brief</h2><div className="mt-6 space-y-6"><Detail label="Objective" value={booking.campaign_objective} /><Detail label="Requested deliverable" value={booking.deliverable_description} />{booking.company_notes && <Detail label="Additional notes" value={booking.company_notes} />}</div>{booking.deliverable_public_url && <div className="mt-7 border-t border-border pt-5"><p className="text-xs font-bold uppercase tracking-wider text-muted">Published deliverable</p><a href={booking.deliverable_public_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">View LinkedIn post <ExternalLink size={15} /></a></div>}</section><BookingPaymentCard bookingId={booking.booking_id} bookingStatus={booking.booking_status} viewerRole={booking.viewer_role} priceCents={booking.price_cents} initialPayment={payment} /></div><BookingMessageThread bookingId={booking.booking_id} status={booking.booking_status} currentUserId={user.id} initialMessages={messages} /></div></div></main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{value}</p></div>; }
