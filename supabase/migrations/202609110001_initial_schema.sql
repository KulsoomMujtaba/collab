create extension if not exists pgcrypto;

create type public.account_role as enum ('company', 'creator');
create type public.workspace_kind as enum ('company', 'creator', 'agency');
create type public.workspace_member_role as enum ('owner', 'admin', 'member');
create type public.booking_status as enum ('pending', 'accepted', 'declined', 'submitted', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null,
  full_name text not null check (char_length(full_name) between 2 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind public.workspace_kind not null,
  name text not null check (char_length(name) between 2 and 120),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.company_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  website_url text,
  description text check (char_length(description) <= 1000),
  logo_url text,
  updated_at timestamptz not null default now()
);

create table public.creator_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  headline text not null check (char_length(headline) between 2 and 160),
  bio text not null check (char_length(bio) between 20 and 1500),
  country text not null check (char_length(country) between 2 and 80),
  linkedin_url text not null,
  avatar_url text,
  follower_count integer not null default 0 check (follower_count >= 0),
  average_views integer not null default 0 check (average_views >= 0),
  post_rate_cents integer not null check (post_rate_cents >= 0),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.niches (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique
);

create table public.creator_niches (
  creator_workspace_id uuid not null references public.creator_profiles(workspace_id) on delete cascade,
  niche_id bigint not null references public.niches(id) on delete cascade,
  primary key (creator_workspace_id, niche_id)
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_workspace_id uuid not null references public.company_profiles(workspace_id),
  title text not null check (char_length(title) between 2 and 140),
  objective text not null check (char_length(objective) between 10 and 1000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_workspace_id uuid not null references public.creator_profiles(workspace_id),
  deliverable_description text not null check (char_length(deliverable_description) between 10 and 2000),
  desired_publish_date date not null,
  notes text check (char_length(notes) <= 2000),
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'EUR' check (currency = 'EUR'),
  status public.booking_status not null default 'pending',
  responded_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, creator_workspace_id)
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  public_url text not null,
  submitted_by uuid not null references public.profiles(id),
  submitted_at timestamptz not null default now()
);

create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  event_type text not null,
  from_status public.booking_status,
  to_status public.booking_status,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index creator_profiles_published_idx on public.creator_profiles (is_published) where is_published;
create index creator_niches_niche_idx on public.creator_niches (niche_id);
create index campaigns_company_idx on public.campaigns (company_workspace_id, created_at desc);
create index bookings_creator_idx on public.bookings (creator_workspace_id, created_at desc);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

create function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.snapshot_booking_price() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select post_rate_cents, currency into new.price_cents, new.currency
  from public.creator_profiles
  where workspace_id = new.creator_workspace_id and is_published;

  if not found then
    raise exception 'Creator is not available for booking';
  end if;

  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger company_profiles_updated_at before update on public.company_profiles for each row execute function public.set_updated_at();
create trigger creator_profiles_updated_at before update on public.creator_profiles for each row execute function public.set_updated_at();
create trigger campaigns_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
create trigger bookings_snapshot_price before insert on public.bookings for each row execute function public.snapshot_booking_price();

create function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create function public.booking_company_workspace(target_booking_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select c.company_workspace_id
  from public.bookings b join public.campaigns c on c.id = b.campaign_id
  where b.id = target_booking_id;
$$;

create function public.booking_creator_workspace(target_booking_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select creator_workspace_id from public.bookings where id = target_booking_id;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.company_profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.niches enable row level security;
alter table public.creator_niches enable row level security;
alter table public.campaigns enable row level security;
alter table public.bookings enable row level security;
alter table public.deliverables enable row level security;
alter table public.booking_events enable row level security;

create policy "profiles own select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "workspaces members select" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "workspaces creator insert" on public.workspaces for insert to authenticated with check (created_by = auth.uid());
create policy "workspaces owners update" on public.workspaces for update to authenticated using (exists (select 1 from public.workspace_members m where m.workspace_id = id and m.user_id = auth.uid() and m.role = 'owner'));

create policy "members shared workspace select" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "members self bootstrap insert" on public.workspace_members for insert to authenticated with check (user_id = auth.uid() and role = 'owner');

create policy "company members select" on public.company_profiles for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "company members insert" on public.company_profiles for insert to authenticated with check (public.is_workspace_member(workspace_id));
create policy "company members update" on public.company_profiles for update to authenticated using (public.is_workspace_member(workspace_id));

create policy "published creators public select" on public.creator_profiles for select to anon, authenticated using (is_published or user_id = auth.uid());
create policy "creator own insert" on public.creator_profiles for insert to authenticated with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
create policy "creator own update" on public.creator_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "niches public select" on public.niches for select to anon, authenticated using (true);
create policy "creator niches public select" on public.creator_niches for select to anon, authenticated using (exists (select 1 from public.creator_profiles cp where cp.workspace_id = creator_workspace_id and (cp.is_published or cp.user_id = auth.uid())));
create policy "creator niches own insert" on public.creator_niches for insert to authenticated with check (public.is_workspace_member(creator_workspace_id));
create policy "creator niches own delete" on public.creator_niches for delete to authenticated using (public.is_workspace_member(creator_workspace_id));

create policy "campaign company access" on public.campaigns for select to authenticated using (public.is_workspace_member(company_workspace_id));
create policy "campaign company insert" on public.campaigns for insert to authenticated with check (created_by = auth.uid() and public.is_workspace_member(company_workspace_id));
create policy "campaign company update" on public.campaigns for update to authenticated using (public.is_workspace_member(company_workspace_id));

create policy "booking participants select" on public.bookings for select to authenticated using (public.is_workspace_member(creator_workspace_id) or public.is_workspace_member((select c.company_workspace_id from public.campaigns c where c.id = campaign_id)));
create policy "booking company insert" on public.bookings for insert to authenticated with check (status = 'pending' and public.is_workspace_member((select c.company_workspace_id from public.campaigns c where c.id = campaign_id)));

create policy "deliverable participants select" on public.deliverables for select to authenticated using (public.is_workspace_member(public.booking_company_workspace(booking_id)) or public.is_workspace_member(public.booking_creator_workspace(booking_id)));
create policy "deliverable creator insert" on public.deliverables for insert to authenticated with check (submitted_by = auth.uid() and public.is_workspace_member(public.booking_creator_workspace(booking_id)));

create policy "events participants select" on public.booking_events for select to authenticated using (public.is_workspace_member(public.booking_company_workspace(booking_id)) or public.is_workspace_member(public.booking_creator_workspace(booking_id)));

insert into public.niches (name, slug) values
  ('Artificial Intelligence', 'artificial-intelligence'),
  ('B2B Marketing', 'b2b-marketing'),
  ('Future of Work', 'future-of-work'),
  ('Leadership', 'leadership'),
  ('Sales', 'sales'),
  ('SaaS', 'saas'),
  ('Startups', 'startups'),
  ('Technology', 'technology');
