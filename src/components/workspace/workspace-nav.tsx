import { Compass, Handshake, Landmark, LayoutDashboard, MailOpen, UserRound } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavKey = "home" | "requests" | "collaborations" | "payments" | "profile";

export function WorkspaceNav({ role, active }: { role: "company" | "creator"; active: NavKey }) {
  const items = role === "company" ? [
    { key: "home" as const, label: "Discover", href: "/company", icon: Compass },
    { key: "requests" as const, label: "Requests", href: "/company/requests", icon: MailOpen },
    { key: "collaborations" as const, label: "Collaborations", href: "/collaborations", icon: Handshake },
    { key: "payments" as const, label: "Payments", href: "/payments", icon: Landmark },
    { key: "profile" as const, label: "Company profile", href: "/onboarding/company", icon: UserRound },
  ] : [
    { key: "home" as const, label: "Overview", href: "/creator", icon: LayoutDashboard },
    { key: "requests" as const, label: "Requests", href: "/creator/requests", icon: MailOpen },
    { key: "collaborations" as const, label: "Collaborations", href: "/collaborations", icon: Handshake },
    { key: "payments" as const, label: "Payments", href: "/payments", icon: Landmark },
    { key: "profile" as const, label: "Edit profile", href: "/onboarding/creator", icon: UserRound },
  ];
  return <aside className="min-w-0"><nav className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:pb-0">{items.map(({ key, label, href, icon: Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:gap-3", active === key ? "bg-primary/8 text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground")}><Icon size={18} />{label}</Link>)}</nav></aside>;
}
