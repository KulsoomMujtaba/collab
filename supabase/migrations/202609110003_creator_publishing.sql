create function public.set_creator_profile_published(should_publish boolean)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  target_workspace_id uuid;
begin
  select workspace_id into target_workspace_id
  from public.creator_profiles
  where user_id = auth.uid();

  if target_workspace_id is null then
    raise exception 'Complete your creator profile before publishing';
  end if;

  if should_publish and not exists (
    select 1 from public.creator_profiles cp
    where cp.workspace_id = target_workspace_id
      and char_length(trim(cp.display_name)) >= 2
      and char_length(trim(cp.headline)) >= 2
      and char_length(trim(cp.bio)) >= 20
      and char_length(trim(cp.country)) >= 2
      and cp.linkedin_url ~ '^https?://([^/]+\.)?linkedin\.com/'
      and cp.post_rate_cents > 0
      and exists (select 1 from public.creator_niches cn where cn.creator_workspace_id = cp.workspace_id)
  ) then
    raise exception 'Complete all required profile fields before publishing';
  end if;

  update public.creator_profiles
  set is_published = should_publish
  where workspace_id = target_workspace_id;

  return should_publish;
end;
$$;

revoke insert, update on public.creator_profiles from authenticated;
grant execute on function public.set_creator_profile_published(boolean) to authenticated;
