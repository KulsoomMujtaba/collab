"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Check, CircleCheck, LoaderCircle, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { companySchema, creatorSchema, getFieldErrors, type FieldErrors } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/sign-out-button";

const nicheOptions = ["Artificial Intelligence", "B2B Marketing", "Future of Work", "Leadership", "Sales", "SaaS", "Startups", "Technology"];
const creatorSteps = ["Your profile", "Audience & rate", "Preview"];

type Role = "company" | "creator";
type CreatorDraft = { displayName: string; headline: string; bio: string; country: string; linkedinUrl: string; avatarUrl: string; niches: string[]; followerCount: string; averageViews: string; postRate: string };
type CompanyDraft = { companyName: string; websiteUrl: string; description: string; logoUrl: string };

const emptyCreator: CreatorDraft = { displayName: "", headline: "", bio: "", country: "", linkedinUrl: "", avatarUrl: "", niches: [], followerCount: "", averageViews: "", postRate: "" };
const emptyCompany: CompanyDraft = { companyName: "", websiteUrl: "", description: "", logoUrl: "" };

export function OnboardingForm({ role }: { role: Role }) {
  const [creator, setCreator] = useState<CreatorDraft>(emptyCreator);
  const [company, setCompany] = useState<CompanyDraft>(emptyCompany);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function loadDraft() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name, onboarding_data, onboarding_completed_at").eq("id", user.id).single();
      const draft = data?.onboarding_data as CreatorDraft | CompanyDraft | undefined;
      if (draft && Object.keys(draft).length) {
        if (role === "creator") setCreator(draft as CreatorDraft);
        else setCompany(draft as CompanyDraft);
      }
      else if (role === "creator" && data?.onboarding_completed_at) {
        const { data: existing } = await supabase.from("creator_profiles").select("display_name, headline, bio, country, linkedin_url, avatar_url, follower_count, average_views, post_rate_cents, creator_niches(niches(name))").eq("user_id", user.id).single();
        if (existing) setCreator({ displayName: existing.display_name, headline: existing.headline, bio: existing.bio, country: existing.country, linkedinUrl: existing.linkedin_url, avatarUrl: existing.avatar_url ?? "", followerCount: String(existing.follower_count), averageViews: String(existing.average_views), postRate: String(existing.post_rate_cents / 100), niches: (existing.creator_niches as unknown as Array<{ niches: { name: string } | null }>).map((item) => item.niches?.name).filter((name): name is string => Boolean(name)) });
      } else if (role === "creator") setCreator((value) => ({ ...value, displayName: data?.full_name ?? "" }));
    }
    void loadDraft();
  }, [role]);

  const completion = useMemo(() => {
    const values = role === "creator" ? Object.values(creator).filter((value) => Array.isArray(value) ? value.length : value).length : Object.values(company).filter(Boolean).length;
    return Math.round((values / (role === "creator" ? 10 : 4)) * 100);
  }, [company, creator, role]);

  async function saveDraft() {
    setSaving(true); setSaveError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError("Your session expired. Sign in again to continue."); setSaving(false); return false; }
    const { error } = await supabase.from("profiles").update({ onboarding_data: role === "creator" ? creator : company }).eq("id", user.id);
    if (error) { setSaveError(error.message); setSaving(false); return false; }
    setSaving(false); setSaved(true); window.setTimeout(() => setSaved(false), 1600); return true;
  }

  function validateCreatorStep() {
    const result = creatorSchema.safeParse(creator);
    if (result.success) { setErrors({}); return true; }
    const allErrors = getFieldErrors(result.error);
    const relevant = step === 0 ? ["displayName", "headline", "bio", "country", "linkedinUrl", "avatarUrl"] : ["niches", "followerCount", "averageViews", "postRate"];
    const visible = Object.fromEntries(Object.entries(allErrors).filter(([key]) => relevant.includes(key)));
    setErrors(visible);
    return Object.keys(visible).length === 0;
  }

  async function next() {
    if (!validateCreatorStep()) return;
    if (!await saveDraft()) return;
    setStep((current) => Math.min(current + 1, 2)); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    const result = role === "creator" ? creatorSchema.safeParse(creator) : companySchema.safeParse(company);
    if (!result.success) { setErrors(getFieldErrors(result.error)); if (role === "creator") setStep(0); return; }
    setErrors({}); setSaveError(""); setSaving(true);
    const supabase = createClient();
    const response = role === "creator"
      ? await supabase.rpc("complete_creator_onboarding", {
          display_name: creator.displayName, headline: creator.headline, bio: creator.bio,
          country: creator.country, linkedin_url: creator.linkedinUrl, avatar_url: creator.avatarUrl,
          follower_count: Number(creator.followerCount), average_views: Number(creator.averageViews),
          post_rate_cents: Number(creator.postRate) * 100, niche_names: creator.niches,
        })
      : await supabase.rpc("complete_company_onboarding", {
          company_name: company.companyName, website_url: company.websiteUrl,
          company_description: company.description, logo_url: company.logoUrl,
        });
    if (response.error) { setSaveError(response.error.message); setSaving(false); return; }
    setSaving(false); setComplete(true);
  }

  if (complete) return <SuccessState role={role} />;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/" className="display text-2xl font-extrabold text-primary">Collab<span className="text-accent">.</span></Link><div className="flex items-center gap-1 sm:gap-3"><span className={cn("hidden items-center gap-1.5 text-xs font-semibold text-success sm:flex", !saved && "invisible")}><Check size={14} /> Draft saved</span><button onClick={() => void saveDraft()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60 sm:px-4">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} <span className="hidden sm:inline">Save draft</span></button><SignOutButton /></div></div></header>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[240px_1fr] lg:py-14">
        <aside><p className="text-xs font-bold uppercase tracking-[.16em] text-primary">{role} setup</p><h1 className="display mt-3 text-3xl font-extrabold">Make a strong first impression.</h1><p className="mt-3 text-sm leading-6 text-muted">You can edit these details later.</p><div className="mt-7 h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div><p className="mt-2 text-xs font-semibold text-muted">{completion}% complete</p>{role === "creator" && <ol className="mt-9 hidden space-y-5 lg:block">{creatorSteps.map((label, index) => <li key={label} className={cn("flex items-center gap-3 text-sm font-semibold", index <= step ? "text-foreground" : "text-muted/60")}><span className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-xs", index < step ? "border-primary bg-primary text-primary-foreground" : index === step ? "border-primary text-primary" : "border-border")}>{index < step ? <Check size={14} /> : index + 1}</span>{label}</li>)}</ol>}</aside>
        <section className="rounded-3xl border border-border bg-surface p-5 card-shadow sm:p-8 lg:p-10">{role === "company" ? <CompanyFields value={company} setValue={setCompany} errors={errors} /> : step === 0 ? <CreatorIdentity value={creator} setValue={setCreator} errors={errors} /> : step === 1 ? <CreatorAudience value={creator} setValue={setCreator} errors={errors} /> : <CreatorPreview value={creator} />}
          {saveError && <p role="alert" className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{saveError}</p>}
          <div className="mt-9 flex items-center justify-between border-t border-border pt-6">{role === "creator" && step > 0 ? <button onClick={() => { setErrors({}); setStep((value) => value - 1); }} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft size={17} /> Back</button> : <span />}{role === "creator" && step < 2 ? <button onClick={() => void next()} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : <>Continue <ArrowRight size={17} /></>}</button> : <button onClick={() => void finish()} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />} {saving ? "Saving..." : role === "creator" ? "Finish profile" : "Finish setup"}</button>}</div>
        </section>
      </div>
    </main>
  );
}

function CompanyFields({ value, setValue, errors }: { value: CompanyDraft; setValue: (value: CompanyDraft) => void; errors: FieldErrors }) {
  const update = (key: keyof CompanyDraft, fieldValue: string) => setValue({ ...value, [key]: fieldValue });
  return <div><p className="text-sm font-bold text-primary">Company profile</p><h2 className="display mt-2 text-3xl font-extrabold">Tell creators who you are.</h2><p className="mt-3 text-muted">A little context helps creators decide whether the partnership is a good fit.</p><div className="mt-8 grid gap-6 sm:grid-cols-2"><FormField label="Company name" value={value.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Acme Inc." error={errors.companyName} /><FormField label="Company website" type="url" value={value.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} placeholder="https://acme.com" error={errors.websiteUrl} /><TextAreaField label="Short description" value={value.description} onChange={(e) => update("description", e.target.value)} placeholder="What do you build, and who is it for?" error={errors.description} className="min-h-36" /><FormField label="Logo URL" type="url" value={value.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." error={errors.logoUrl} hint="Optional for the MVP" /></div></div>;
}

function CreatorIdentity({ value, setValue, errors }: { value: CreatorDraft; setValue: (value: CreatorDraft) => void; errors: FieldErrors }) {
  const update = (key: keyof CreatorDraft, fieldValue: string) => setValue({ ...value, [key]: fieldValue });
  return <div><p className="text-sm font-bold text-primary">Step 1 of 3</p><h2 className="display mt-2 text-3xl font-extrabold">Start with your story.</h2><p className="mt-3 text-muted">This is what companies will see while discovering creators.</p><div className="mt-8 grid gap-6 sm:grid-cols-2"><FormField label="Display name" value={value.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Amina Malik" error={errors.displayName} /><FormField label="Country" value={value.country} onChange={(e) => update("country", e.target.value)} placeholder="United Kingdom" error={errors.country} /><FormField label="Professional headline" value={value.headline} onChange={(e) => update("headline", e.target.value)} placeholder="B2B growth strategist" error={errors.headline} className="sm:col-span-2" /><div className="sm:col-span-2"><TextAreaField label="Bio" value={value.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Share your expertise, audience, and point of view..." error={errors.bio} /></div><FormField label="LinkedIn profile" type="url" value={value.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." error={errors.linkedinUrl} /><FormField label="Avatar URL" type="url" value={value.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)} placeholder="https://..." error={errors.avatarUrl} hint="Optional for now" /></div></div>;
}

function CreatorAudience({ value, setValue, errors }: { value: CreatorDraft; setValue: (value: CreatorDraft) => void; errors: FieldErrors }) {
  const update = (key: keyof CreatorDraft, fieldValue: string) => setValue({ ...value, [key]: fieldValue });
  function toggleNiche(niche: string) { const selected = value.niches.includes(niche); if (!selected && value.niches.length === 3) return; setValue({ ...value, niches: selected ? value.niches.filter((item) => item !== niche) : [...value.niches, niche] }); }
  return <div><p className="text-sm font-bold text-primary">Step 2 of 3</p><h2 className="display mt-2 text-3xl font-extrabold">Define your audience and rate.</h2><p className="mt-3 text-muted">Keep it simple: one sponsored LinkedIn post, one clear price.</p><div className="mt-8"><p className="text-sm font-semibold">Your niches <span className="font-normal text-muted">(choose up to 3)</span></p><div className="mt-3 flex flex-wrap gap-2">{nicheOptions.map((niche) => <button type="button" key={niche} onClick={() => toggleNiche(niche)} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition", value.niches.includes(niche) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}>{niche}</button>)}</div>{errors.niches && <p className="mt-2 text-sm text-destructive">{errors.niches}</p>}</div><div className="mt-8 grid gap-6 sm:grid-cols-3"><FormField label="LinkedIn followers" type="number" min="0" inputMode="numeric" value={value.followerCount} onChange={(e) => update("followerCount", e.target.value)} placeholder="42000" error={errors.followerCount} /><FormField label="Average post views" type="number" min="0" inputMode="numeric" value={value.averageViews} onChange={(e) => update("averageViews", e.target.value)} placeholder="18000" error={errors.averageViews} /><FormField label="Post rate (€)" type="number" min="1" inputMode="numeric" value={value.postRate} onChange={(e) => update("postRate", e.target.value)} placeholder="650" error={errors.postRate} /></div><div className="mt-8 rounded-2xl bg-surface-muted p-5 text-sm leading-6 text-muted"><strong className="text-foreground">Good to know:</strong> companies will see this fixed rate before sending a request. Payments and negotiation happen outside Collab in the MVP.</div></div>;
}

function CreatorPreview({ value }: { value: CreatorDraft }) {
  const initials = value.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CO";
  return <div><p className="text-sm font-bold text-primary">Step 3 of 3</p><h2 className="display mt-2 text-3xl font-extrabold">See what companies will see.</h2><p className="mt-3 text-muted">This profile stays private until publishing is connected.</p><div className="mt-8 overflow-hidden rounded-3xl border border-border"><div className="h-24 bg-primary" /><div className="px-6 pb-7 sm:px-8"><div className="-mt-9 flex h-18 w-18 items-center justify-center rounded-2xl border-4 border-surface bg-accent text-lg font-extrabold text-primary">{initials}</div><div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex items-center gap-2"><h3 className="text-2xl font-extrabold">{value.displayName}</h3><BadgeCheck size={20} className="text-primary" /></div><p className="mt-1 text-muted">{value.headline} · {value.country}</p></div><div className="sm:text-right"><p className="text-xs text-muted">Sponsored post</p><p className="text-xl font-extrabold text-primary">€{Number(value.postRate).toLocaleString()}</p></div></div><p className="mt-6 max-w-2xl leading-7 text-muted">{value.bio}</p><div className="mt-6 flex flex-wrap gap-2">{value.niches.map((niche) => <span key={niche} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-primary">{niche}</span>)}</div><div className="mt-7 grid grid-cols-2 gap-4 border-t border-border pt-6"><div><p className="text-xs text-muted">LinkedIn followers</p><p className="mt-1 text-lg font-bold">{Number(value.followerCount).toLocaleString()}</p></div><div><p className="text-xs text-muted">Average views</p><p className="mt-1 text-lg font-bold">{Number(value.averageViews).toLocaleString()}</p></div></div></div></div></div>;
}

function SuccessState({ role }: { role: Role }) {
  const destination = role === "creator" ? "/creator" : "/company";
  return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-8 text-center card-shadow sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f7f0] text-success"><CircleCheck size={32} /></div><p className="mt-7 text-sm font-bold uppercase tracking-[.16em] text-primary">Profile ready</p><h1 className="display mt-3 text-4xl font-extrabold">You&apos;re ready for what&apos;s next.</h1><p className="mt-4 leading-7 text-muted">Your {role} profile is now securely saved. Next, we&apos;ll bring your Collab workspace to life.</p><Link href={destination} className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 font-semibold text-primary-foreground hover:bg-primary-hover">{role === "creator" ? "Open creator dashboard" : "Discover creators"}</Link></div></main>;
}
