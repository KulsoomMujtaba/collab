"use client";

import { LoaderCircle, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type BookingMessage, type BookingStatus, messagingStatuses } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/client";
import { bookingMessageSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function BookingMessageThread({ bookingId, status, currentUserId, initialMessages }: { bookingId: string; status: BookingStatus; currentUserId: string; initialMessages: BookingMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const enabled = messagingStatuses.includes(status);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages]);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = bookingMessageSchema.safeParse({ body });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Write a message before sending."); return; }
    setSending(true); setError("");
    const { data, error: sendError } = await createClient().rpc("send_booking_message", { p_booking_id: bookingId, p_body: parsed.data.body });
    if (sendError) { setError(sendError.message); setSending(false); return; }
    const sent = (data?.[0] ?? null) as BookingMessage | null;
    if (sent) setMessages((current) => [...current, sent]);
    setBody(""); setSending(false);
  }

  return <section className="overflow-hidden rounded-3xl border border-border bg-surface card-shadow"><div className="border-b border-border px-5 py-4 sm:px-6"><div className="flex items-center gap-2"><MessageCircle size={18} className="text-primary" /><h2 className="font-bold">Collaboration messages</h2></div><p className="mt-1 text-xs text-muted">A shared thread for this booking only.</p></div>
    {!enabled ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-muted"><MessageCircle size={20} /></div><p className="mt-4 font-bold">Messaging isn&apos;t available</p><p className="mt-2 max-w-xs text-sm leading-6 text-muted">The thread opens after the creator accepts and stays closed for declined or cancelled requests.</p></div> : <><div className="max-h-[430px] min-h-72 space-y-4 overflow-y-auto px-5 py-6 sm:px-6">{messages.length ? messages.map((message) => { const own = message.sender_id === currentUserId; return <div key={message.message_id} className={cn("flex", own ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] sm:max-w-[78%]", own && "text-right")}><div className="mb-1 flex items-center gap-2 text-xs text-muted"><span className="font-semibold text-foreground">{own ? "You" : message.sender_name}</span><span>·</span><time dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time></div><p className={cn("whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-sm leading-6", own ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-surface-muted text-foreground")}>{message.body}</p></div></div>; }) : <div className="flex min-h-56 flex-col items-center justify-center text-center"><p className="font-bold">Start the conversation</p><p className="mt-2 max-w-xs text-sm leading-6 text-muted">Use this thread to clarify the brief, timing, or delivery.</p></div>}<div ref={endRef} /></div><form onSubmit={send} className="border-t border-border bg-background p-4 sm:p-5"><label htmlFor="booking-message" className="sr-only">Message</label><textarea id="booking-message" value={body} onChange={(event) => { setBody(event.target.value); if (error) setError(""); }} rows={3} maxLength={2000} placeholder="Write a message about this collaboration…" className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted/65 focus:border-primary focus:ring-2 focus:ring-primary/10" /><div className="mt-3 flex items-center justify-between gap-4"><p className={cn("text-xs", error ? "text-destructive" : "text-muted")}>{error || `${body.length}/2000`}</p><button disabled={sending} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{sending ? "Sending…" : "Send"}</button></div></form></>}
  </section>;
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
