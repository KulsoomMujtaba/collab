"use client";

import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { createClient } from "@/lib/supabase/client";
import { bookingRequestSchema, getFieldErrors, type FieldErrors } from "@/lib/validation";

type RequestDraft = { campaignTitle: string; objective: string; deliverableDescription: string; desiredPublishDate: string; notes: string };
const emptyDraft: RequestDraft = { campaignTitle: "", objective: "", deliverableDescription: "", desiredPublishDate: "", notes: "" };

export function RequestCollaborationPanel({ creatorWorkspaceId, creatorName, rate }: { creatorWorkspaceId: string; creatorName: string; rate: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"brief" | "review" | "success">("brief");
  const [draft, setDraft] = useState<RequestDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => titleRef.current?.focus(), 50);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !submitting) setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, submitting]);

  function update(key: keyof RequestDraft, value: string) { setDraft((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })); }

  function review(event: FormEvent) {
    event.preventDefault();
    const result = bookingRequestSchema.safeParse(draft);
    if (!result.success) { setErrors(getFieldErrors(result.error)); return; }
    setErrors({}); setStep("review");
  }

  async function submit() {
    const result = bookingRequestSchema.safeParse(draft);
    if (!result.success) { setErrors(getFieldErrors(result.error)); setStep("brief"); return; }
    setSubmitting(true); setRequestError("");
    const { error } = await createClient().rpc("create_booking_request", {
      p_creator_workspace_id: creatorWorkspaceId,
      p_campaign_title: result.data.campaignTitle,
      p_campaign_objective: result.data.objective,
      p_deliverable_description: result.data.deliverableDescription,
      p_desired_publish_date: result.data.desiredPublishDate,
      p_company_notes: result.data.notes,
    });
    if (error) { setRequestError(error.message); setSubmitting(false); return; }
    setSubmitting(false); setStep("success");
  }

  function close() { if (submitting) return; setOpen(false); window.setTimeout(() => { setStep("brief"); setDraft(emptyDraft); setErrors({}); setRequestError(""); }, 200); }

  return <>
    <button onClick={() => setOpen(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary-hover"><Send size={17} /> Request collaboration</button>
    {open && <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section role="dialog" aria-modal="true" aria-labelledby="request-panel-title" className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-background shadow-2xl"><header className="flex items-center justify-between border-b border-border bg-surface px-5 py-5 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-primary">Collaboration request</p><h2 id="request-panel-title" className="display mt-1 text-xl font-extrabold">Partner with {creatorName}</h2></div><button onClick={close} aria-label="Close request panel" className="rounded-full p-2 text-muted hover:bg-surface-muted"><X size={20} /></button></header>
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">{step === "success" ? <Success creatorName={creatorName} close={close} /> : <><div className="mb-7 flex items-center gap-3"><span className={step === "brief" ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" : "flex h-7 w-7 items-center justify-center rounded-full bg-success text-xs font-bold text-white"}>{step === "brief" ? "1" : "✓"}</span><span className="text-sm font-semibold">Campaign brief</span><div className="h-px flex-1 bg-border" /><span className={step === "review" ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" : "flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs font-bold text-muted"}>2</span><span className={step === "review" ? "text-sm font-semibold" : "text-sm font-semibold text-muted"}>Review</span></div>{step === "brief" ? <form id="request-form" onSubmit={review} noValidate className="space-y-5"><FormField ref={titleRef} label="Campaign title" value={draft.campaignTitle} onChange={(event) => update("campaignTitle", event.target.value)} placeholder="e.g. The human side of AI adoption" error={errors.campaignTitle} /><TextAreaField label="What do you want to achieve?" value={draft.objective} onChange={(event) => update("objective", event.target.value)} placeholder="Describe the audience, message, and outcome for this campaign." error={errors.objective} /><TextAreaField label="What should the creator deliver?" value={draft.deliverableDescription} onChange={(event) => update("deliverableDescription", event.target.value)} placeholder="Outline the sponsored LinkedIn post, important talking points, and any requirements." error={errors.deliverableDescription} /><FormField label="Desired publication date" type="date" min={today} value={draft.desiredPublishDate} onChange={(event) => update("desiredPublishDate", event.target.value)} error={errors.desiredPublishDate} /><TextAreaField label="Anything else?" value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Optional context, links, or constraints." error={errors.notes} hint="Optional" /></form> : <Review draft={draft} creatorName={creatorName} rate={rate} />}{requestError && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{requestError}</p>}</>}</div>
      {step !== "success" && <footer className="border-t border-border bg-surface px-5 py-4 sm:px-7"><div className="flex items-center justify-between gap-4">{step === "review" ? <button onClick={() => { setRequestError(""); setStep("brief"); }} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft size={16} /> Edit brief</button> : <p className="text-sm text-muted"><strong className="text-foreground">{rate}</strong> creator fee</p>}{step === "brief" ? <button form="request-form" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Review request <ArrowRight size={16} /></button> : <button onClick={() => void submit()} disabled={submitting} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={16} />}{submitting ? "Sending..." : "Send request"}</button>}</div></footer>}
    </section></div>}
  </>;
}

function Review({ draft, creatorName, rate }: { draft: RequestDraft; creatorName: string; rate: string }) {
  return <div><div className="rounded-2xl border border-border bg-surface p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted">Requesting</p><p className="mt-1 text-lg font-bold">{creatorName}</p><div className="my-5 h-px bg-border" /><ReviewItem label="Campaign" value={draft.campaignTitle} /><ReviewItem label="Objective" value={draft.objective} /><ReviewItem label="Deliverable" value={draft.deliverableDescription} /><ReviewItem label="Desired publication" value={new Date(`${draft.desiredPublishDate}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })} icon={<CalendarDays size={16} />} />{draft.notes && <ReviewItem label="Additional notes" value={draft.notes} />}</div><div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-muted p-5"><div><p className="text-sm font-bold">Creator fee</p><p className="mt-1 text-xs text-muted">Paid outside Collab in the MVP</p></div><p className="text-2xl font-extrabold text-primary">{rate}</p></div></div>;
}

function ReviewItem({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) { return <div className="mb-5 last:mb-0"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 flex items-start gap-2 whitespace-pre-line text-sm leading-6">{icon}{value}</p></div>; }

function Success({ creatorName, close }: { creatorName: string; close: () => void }) { return <div className="flex min-h-[65vh] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f7f0] text-success"><CheckCircle2 size={31} /></div><p className="mt-6 text-sm font-bold uppercase tracking-[.15em] text-primary">Request sent</p><h3 className="display mt-2 text-3xl font-extrabold">It&apos;s with {creatorName}.</h3><p className="mt-3 max-w-sm leading-7 text-muted">Your brief and the creator&apos;s current rate are locked in. Track the response from your company workspace.</p><div className="mt-7 flex gap-3"><button onClick={close} className="h-11 rounded-full border border-border px-5 text-sm font-semibold hover:bg-surface-muted">Stay here</button><a href="/company/requests" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">View requests</a></div></div>; }
