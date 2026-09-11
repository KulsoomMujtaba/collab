"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { getFieldErrors, loginSchema, type FieldErrors } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = loginSchema.safeParse(Object.fromEntries(form));
    if (!result.success) return setErrors(getFieldErrors(result.error));
    setErrors({}); setAuthError(""); setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(result.data);
    if (error) { setAuthError(error.message); setSubmitting(false); return; }
    const role = data.user.user_metadata.role === "creator" ? "creator" : "company";
    const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at").eq("id", data.user.id).single();
    router.push(profile?.onboarding_completed_at ? (role === "creator" ? "/creator" : "/company") : `/onboarding/${role}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email} />
      <div className="relative"><FormField label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="At least 8 characters" error={errors.password} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-10 rounded-lg p-2 text-muted hover:bg-surface-muted">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <div className="flex justify-end"><button type="button" className="text-sm font-semibold text-primary hover:underline">Forgot password?</button></div>
      {authError && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{authError}</p>}
      <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60">{submitting && <LoaderCircle size={18} className="animate-spin" />} {submitting ? "Signing in..." : "Sign in"}</button>
      <p className="text-center text-sm text-muted">New to Collab? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p>
    </form>
  );
}
