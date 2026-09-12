import { Landmark } from "lucide-react";
import type { PaymentStatus } from "@/lib/bookings";
import { cn } from "@/lib/utils";

const presentation: Record<PaymentStatus, { label: string; className: string }> = {
  awaiting_deposit: { label: "Payment · Awaiting deposit", className: "bg-accent/35 text-primary" },
  held: { label: "Payment · Funds held", className: "bg-primary/8 text-primary" },
  released: { label: "Payment · Released", className: "bg-surface-muted text-primary" },
  received: { label: "Payment · Received", className: "bg-success/10 text-success" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const item = presentation[status];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", item.className)}><Landmark size={12} />{item.label}</span>;
}
