import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PaymentStatusBadge } from "@/components/bookings/payment-status-badge";
import { StatusBadge } from "@/components/bookings/status-badge";
import { formatBookingDate, type CollaborationOverview } from "@/lib/bookings";
import { formatRate, initials } from "@/lib/creator-profile";

type GroupKey = "action" | "progress" | "complete";

const groups: Array<{ key: GroupKey; title: string; description: string }> = [
  { key: "action", title: "Needs your action", description: "The next step is yours." },
  { key: "progress", title: "In progress", description: "Active work that is moving or waiting on the other party." },
  { key: "complete", title: "Completed", description: "Finished collaborations and their retained history." },
];

export function CollaborationOverviewList({ items, role, loadError }: { items: CollaborationOverview[]; role: "company" | "creator"; loadError?: string }) {
  if (loadError) return <Empty title="Collaborations couldn't be loaded" description="Refresh the page to try connecting again." />;
  if (!items.length) return <Empty title="No active collaborations yet" description={role === "company" ? "Accepted creator requests will appear here." : "Accepted company requests will appear here."} />;

  return <div className="space-y-10">{groups.map((group) => {
    const grouped = items.filter((item) => categoryFor(item, role) === group.key);
    if (!grouped.length) return null;
    return <section key={group.key}>
      <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="display text-2xl font-extrabold">{group.title}</h2><p className="mt-1 text-sm text-muted">{group.description}</p></div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted">{grouped.length}</span></div>
      <div className="space-y-3">{grouped.map((item) => <CollaborationCard key={item.booking_id} item={item} role={role} />)}</div>
    </section>;
  })}</div>;
}

function CollaborationCard({ item, role }: { item: CollaborationOverview; role: "company" | "creator" }) {
  const nextStep = getNextStep(item, role);
  return <article className="rounded-2xl border border-border bg-surface p-5 card-shadow">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-sm font-extrabold text-primary">{item.counterpart_avatar_url ? <Image unoptimized src={item.counterpart_avatar_url} alt="" width={48} height={48} className="h-full w-full object-cover" /> : initials(item.counterpart_name)}</div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={item.booking_status} />{item.payment_status && <PaymentStatusBadge status={item.payment_status} />}</div><h3 className="display mt-2 truncate text-xl font-extrabold">{item.campaign_title}</h3><p className="mt-0.5 truncate text-sm font-semibold text-muted">With {item.counterpart_name}</p></div>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-4 text-sm sm:flex sm:items-center sm:gap-7">
        <div><p className="text-xs text-muted">Fee</p><p className="mt-1 font-extrabold text-primary">{formatRate(item.price_cents)}</p></div>
        <div><p className="text-xs text-muted">Publish by</p><p className="mt-1 flex items-center gap-1.5 font-semibold"><CalendarDays size={14} className="text-muted" />{formatBookingDate(item.desired_publish_date)}</p></div>
      </div>
    </div>
    <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><MessageCircle size={14} /> Latest message</p>{item.last_message_body ? <p className="mt-1 truncate text-sm"><span className="font-semibold">{item.last_message_sender_name}:</span> {item.last_message_body} <span className="ml-1 text-xs text-muted">· {new Date(item.last_message_at!).toLocaleDateString("en", { day: "numeric", month: "short" })}</span></p> : <p className="mt-1 text-sm text-muted">No messages yet</p>}</div>
      <Link href={`/bookings/${item.booking_id}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline">{nextStep} <ArrowRight size={16} /></Link>
    </div>
  </article>;
}

function categoryFor(item: CollaborationOverview, role: "company" | "creator"): GroupKey {
  if (role === "company" && ((item.booking_status === "accepted" && item.payment_status === "awaiting_deposit") || (item.booking_status === "submitted" && item.payment_status === "held"))) return "action";
  if (role === "creator" && ((item.booking_status === "accepted" && item.payment_status === "held") || (item.booking_status === "completed" && item.payment_status === "released"))) return "action";
  if (item.booking_status === "completed" && item.payment_status === "received") return "complete";
  if (item.booking_status === "cancelled") return "complete";
  return "progress";
}

function getNextStep(item: CollaborationOverview, role: "company" | "creator") {
  if (role === "company" && item.booking_status === "accepted" && item.payment_status === "awaiting_deposit") return "Deposit funds";
  if (role === "company" && item.booking_status === "submitted" && item.payment_status === "held") return "Review & release";
  if (role === "creator" && item.booking_status === "accepted" && item.payment_status === "held") return "Submit deliverable";
  if (role === "creator" && item.booking_status === "completed" && item.payment_status === "released") return "Confirm receipt";
  return "Open collaboration";
}

function Empty({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface px-6 text-center"><h2 className="display text-2xl font-extrabold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p></div>;
}
