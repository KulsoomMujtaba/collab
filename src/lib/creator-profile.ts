export type CreatorProfile = {
  workspace_id: string;
  display_name: string;
  headline: string;
  bio: string;
  country: string;
  linkedin_url: string;
  avatar_url: string | null;
  follower_count: number;
  average_views: number;
  post_rate_cents: number;
  currency: string;
  is_published: boolean;
  creator_niches: Array<{ niches: { name: string } | null }>;
};

export function creatorNiches(profile: CreatorProfile) {
  return profile.creator_niches.map((item) => item.niches?.name).filter((name): name is string => Boolean(name));
}

export function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function formatRate(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}
