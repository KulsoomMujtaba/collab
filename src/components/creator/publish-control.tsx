"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PublishControl({ published }: { published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true); setError("");
    const { error: publishError } = await createClient().rpc("set_creator_profile_published", { should_publish: !published });
    if (publishError) { setError(publishError.message); setBusy(false); return; }
    router.refresh();
  }

  return <div><button onClick={() => void toggle()} disabled={busy} className={published ? "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60" : "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : published ? <EyeOff size={17} /> : <Eye size={17} />}{busy ? "Updating..." : published ? "Unpublish profile" : "Publish profile"}</button>{error && <p role="alert" className="mt-2 max-w-sm text-sm text-destructive">{error}</p>}</div>;
}
