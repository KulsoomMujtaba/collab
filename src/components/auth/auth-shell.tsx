import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.82fr_1.18fr]">
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border-[70px] border-accent/15" />
        <Link href="/" className="display relative text-2xl font-extrabold">Collab<span className="text-accent">.</span></Link>
        <div className="relative my-auto max-w-md">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-accent">Clear from day one</p>
          <h2 className="display mt-4 text-4xl font-extrabold leading-tight">Great partnerships need alignment, not more admin.</h2>
          <ul className="mt-9 space-y-4 text-sm text-primary-foreground/80">
            {["A concise brief both sides can trust", "Fixed creator rates with no awkward negotiation", "One shared path from request to published post"].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 size={19} className="shrink-0 text-accent" />{item}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/55">Built for thoughtful B2B collaborations.</p>
      </aside>
      <section className="flex min-h-screen flex-col bg-background px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft size={17} /> Back home</Link>
          <Link href="/" className="display text-xl font-extrabold text-primary lg:hidden">Collab<span className="text-accent">.</span></Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-lg py-12">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p>
          <h1 className="display mt-3 text-4xl font-extrabold sm:text-5xl">{title}</h1>
          <p className="mt-4 leading-7 text-muted">{description}</p>
          <div className="mt-9">{children}</div>
        </div>
      </section>
    </main>
  );
}
