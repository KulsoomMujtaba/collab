"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deliverableSchema } from "@/lib/validation";

export function BookingDeliverableForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = deliverableSchema.safeParse({ publicUrl });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a valid LinkedIn URL."); return; }
    setSubmitting(true); setError("");
    const { error: submitError } = await createClient().rpc("submit_booking_deliverable", { p_booking_id: bookingId, p_public_url: parsed.data.publicUrl });
    if (submitError) { setError(submitError.message); setSubmitting(false); return; }
    setSubmitted(true); setSubmitting(false); router.refresh();
  }

  if (submitted) return <section className="rounded-3xl border border-success/20 bg-[#e9f7f0] p-5 sm:p-6"><div className="flex items-center gap-2 text-success"><CheckCircle2 size={19} /><h2 className="font-bold">Deliverable submitted</h2></div><p className="mt-2 text-sm leading-6 text-muted">The company can now review your LinkedIn post and approve the collaboration.</p></section>;

  return <section className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-6"><div><p className="text-sm font-bold uppercase tracking-[.14em] text-primary">Next step</p><h2 className="display mt-2 text-2xl font-extrabold">Submit your LinkedIn post</h2><p className="mt-2 text-sm leading-6 text-muted">Funds are marked as held. Publish the agreed post, then add its public URL here for company review.</p></div><form onSubmit={submit} className="mt-5"><label htmlFor="deliverable-url" className="text-sm font-bold">Public LinkedIn URL</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="deliverable-url" type="url" value={publicUrl} onChange={(event) => { setPublicUrl(event.target.value); if (error) setError(""); }} placeholder="https://www.linkedin.com/posts/..." className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" /><button disabled={submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}{submitting ? "Submitting…" : "Submit post"}</button></div>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</form></section>;
}
