alter table public.profiles
  add column onboarding_data jsonb not null default '{}'::jsonb,
  add column onboarding_completed_at timestamptz;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  account_role public.account_role;
  workspace_id uuid;
  account_name text;
begin
  account_role := (new.raw_user_meta_data ->> 'role')::public.account_role;
  account_name := trim(new.raw_user_meta_data ->> 'full_name');

  if account_name is null or char_length(account_name) < 2 then
    raise exception 'A valid full name is required';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, account_role, account_name);

  insert into public.workspaces (kind, name, created_by)
  values (account_role::text::public.workspace_kind, account_name, new.id)
  returning id into workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.complete_company_onboarding(
  company_name text,
  website_url text,
  company_description text,
  logo_url text
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  target_workspace_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'company') then
    raise exception 'Company account required';
  end if;

  select wm.workspace_id into target_workspace_id
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = auth.uid() and w.kind = 'company'
  limit 1;

  update public.workspaces set name = trim(company_name) where id = target_workspace_id;

  insert into public.company_profiles (workspace_id, website_url, description, logo_url)
  values (target_workspace_id, nullif(trim(website_url), ''), nullif(trim(company_description), ''), nullif(trim(logo_url), ''))
  on conflict (workspace_id) do update set
    website_url = excluded.website_url,
    description = excluded.description,
    logo_url = excluded.logo_url;

  update public.profiles
  set onboarding_data = '{}'::jsonb, onboarding_completed_at = now()
  where id = auth.uid();

  return target_workspace_id;
end;
$$;

create function public.complete_creator_onboarding(
  display_name text,
  headline text,
  bio text,
  country text,
  linkedin_url text,
  avatar_url text,
  follower_count integer,
  average_views integer,
  post_rate_cents integer,
  niche_names text[]
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  target_workspace_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'creator') then
    raise exception 'Creator account required';
  end if;

  if coalesce(array_length(niche_names, 1), 0) not between 1 and 3 then
    raise exception 'Choose between one and three niches';
  end if;

  select wm.workspace_id into target_workspace_id
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = auth.uid() and w.kind = 'creator'
  limit 1;

  insert into public.creator_profiles (
    workspace_id, user_id, display_name, headline, bio, country, linkedin_url,
    avatar_url, follower_count, average_views, post_rate_cents, is_published
  ) values (
    target_workspace_id, auth.uid(), trim(display_name), trim(headline), trim(bio), trim(country),
    trim(linkedin_url), nullif(trim(avatar_url), ''), follower_count, average_views, post_rate_cents, false
  )
  on conflict (workspace_id) do update set
    display_name = excluded.display_name,
    headline = excluded.headline,
    bio = excluded.bio,
    country = excluded.country,
    linkedin_url = excluded.linkedin_url,
    avatar_url = excluded.avatar_url,
    follower_count = excluded.follower_count,
    average_views = excluded.average_views,
    post_rate_cents = excluded.post_rate_cents;

  delete from public.creator_niches where creator_workspace_id = target_workspace_id;
  insert into public.creator_niches (creator_workspace_id, niche_id)
  select target_workspace_id, n.id from public.niches n where n.name = any(niche_names);

  update public.profiles
  set onboarding_data = '{}'::jsonb, onboarding_completed_at = now()
  where id = auth.uid();

  return target_workspace_id;
end;
$$;

revoke update on public.profiles from authenticated;
grant update (full_name, onboarding_data) on public.profiles to authenticated;
grant execute on function public.complete_company_onboarding(text, text, text, text) to authenticated;
grant execute on function public.complete_creator_onboarding(text, text, text, text, text, text, integer, integer, integer, text[]) to authenticated;
