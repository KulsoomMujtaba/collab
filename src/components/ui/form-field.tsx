import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BaseProps = { label: string; error?: string; hint?: string };

export const FormField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(function FormField({ label, error, hint, className, ...props }, ref) {
  const id = props.id ?? props.name;
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input ref={ref} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn("h-12 w-full rounded-xl border bg-surface px-4 text-[15px] outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-3 focus:ring-primary/10", error ? "border-destructive" : "border-border", className)} {...props} />
      {error ? <span id={`${id}-error`} className="mt-1.5 block text-sm text-destructive">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
});

export function TextAreaField({ label, error, hint, className, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = props.id ?? props.name;
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={cn("min-h-28 w-full resize-y rounded-xl border bg-surface px-4 py-3 text-[15px] outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-3 focus:ring-primary/10", error ? "border-destructive" : "border-border", className)} {...props} />
      {error ? <span id={`${id}-error`} className="mt-1.5 block text-sm text-destructive">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
