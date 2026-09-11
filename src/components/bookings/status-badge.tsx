import type { BookingStatus } from "@/lib/bookings";
import { cn } from "@/lib/utils";

const styles: Record<BookingStatus, string> = {
  pending: "bg-[#fff4d8] text-[#8a5b00]", accepted: "bg-[#e9f7f0] text-success",
  declined: "bg-destructive/8 text-destructive", submitted: "bg-[#eaf1ff] text-[#315ea8]",
  completed: "bg-primary/8 text-primary", cancelled: "bg-surface-muted text-muted",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize", styles[status])}>{status}</span>;
}
