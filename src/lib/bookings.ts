export type BookingStatus = "pending" | "accepted" | "declined" | "submitted" | "completed" | "cancelled";

export type BookingBase = {
  booking_id: string;
  booking_status: BookingStatus;
  campaign_title: string;
  campaign_objective: string;
  deliverable_description: string;
  desired_publish_date: string;
  company_notes: string | null;
  price_cents: number;
  currency: string;
  created_at: string;
  responded_at: string | null;
  deliverable_public_url: string | null;
  deliverable_submitted_at: string | null;
  completed_at: string | null;
};

export type CreatorBooking = BookingBase & { company_name: string };
export type CompanyBooking = BookingBase & { creator_workspace_id: string; creator_name: string; creator_headline: string; creator_avatar_url: string | null };

export type BookingDetail = BookingBase & {
  company_name: string;
  creator_name: string;
  creator_headline: string;
  creator_avatar_url: string | null;
  viewer_role: "company" | "creator";
};

export type BookingMessage = {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "company" | "creator";
  body: string;
  created_at: string;
};

export const messagingStatuses: BookingStatus[] = ["accepted", "submitted", "completed"];

export const bookingFilters: Array<{ value: "all" | BookingStatus; label: string }> = [
  { value: "all", label: "All" }, { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" }, { value: "declined", label: "Declined" },
  { value: "submitted", label: "Submitted" }, { value: "completed", label: "Completed" },
];

export function formatBookingDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}
