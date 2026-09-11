"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return <button onClick={() => void signOut()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"><LogOut size={16} /> <span className="hidden sm:inline">Sign out</span></button>;
}
