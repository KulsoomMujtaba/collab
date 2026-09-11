"use client";

import { Building2, Eye, EyeOff, LoaderCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { getFieldErrors, signupSchema, type FieldErrors } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [role, setRole] = useState<"company" | "creator" | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { ...Object.fromEntries(new FormData(event.currentTarget)), role };
    const result = signupSchema.safeParse(values);
    if (!result.success) return setErrors(getFieldErrors(result.error));
    setErrors({}); setSubmitting(true);
    localStorage.setItem("collab:role", result.data.role);
    localStorage.setItem("collab:name", result.data.fullName);
    window.setTimeout(() => router.push(`/onboarding/${result.data.role}`), 450);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset><legend className="mb-2 text-sm font-semibold">I&apos;m joining as</legend><div className="grid grid-cols-2 gap-3">{([{ value: "company", label: "A company", note: "Book creators", icon: Building2 }, { value: "creator", label: "A creator", note: "Get booked", icon: UserRound }] as const).map(({ value, label, note, icon: Icon }) => <button type="button" key={value} onClick={() => { setRole(value); setErrors((old) => ({ ...old, role: "" })); }} className={cn("rounded-2xl border p-4 text-left transition", role === value ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "border-border bg-surface hover:border-primary/40")}><Icon size={21} className={role === value ? "text-primary" : "text-muted"} /><span className="mt-3 block text-sm font-bold">{label}</span><span className="mt-0.5 block text-xs text-muted">{note}</span></button>)}</div>{errors.role && <p className="mt-1.5 text-sm text-destructive">{errors.role}</p>}</fieldset>
      <FormField label="Full name" name="fullName" autoComplete="name" placeholder="Your name" error={errors.fullName} />
      <FormField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email} />
      <div className="relative"><FormField label="Password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" error={errors.password} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-10 rounded-lg p-2 text-muted hover:bg-surface-muted">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <FormField label="Confirm password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" error={errors.confirmPassword} />
      <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60">{submitting && <LoaderCircle size={18} className="animate-spin" />} Continue</button>
      <p className="text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
    </form>
  );
}
