create function public.create_booking_request(
  p_creator_workspace_id uuid,
  p_campaign_title text,
  p_campaign_objective text,
  p_deliverable_description text,
  p_desired_publish_date date,
  p_company_notes text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  company_workspace_id uuid;
  new_campaign_id uuid;
  new_booking_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'company' and onboarding_completed_at is not null
  ) then
    raise exception 'Complete company onboarding before requesting a collaboration';
  end if;

  if char_length(trim(p_campaign_title)) not between 2 and 140
    or char_length(trim(p_campaign_objective)) not between 10 and 1000
    or char_length(trim(p_deliverable_description)) not between 10 and 2000
    or char_length(coalesce(p_company_notes, '')) > 2000 then
    raise exception 'Campaign brief is incomplete or too long';
  end if;

  if p_desired_publish_date < current_date then
    raise exception 'Desired publication date must be today or later';
  end if;

  if not exists (
    select 1 from public.creator_profiles
    where workspace_id = p_creator_workspace_id and is_published
  ) then
    raise exception 'This creator is not currently available for booking';
  end if;

  select cp.workspace_id into company_workspace_id
  from public.company_profiles cp
  join public.workspace_members wm on wm.workspace_id = cp.workspace_id
  where wm.user_id = auth.uid()
  limit 1;

  if company_workspace_id is null then
    raise exception 'Company workspace not found';
  end if;

  insert into public.campaigns (company_workspace_id, title, objective, created_by)
  values (company_workspace_id, trim(p_campaign_title), trim(p_campaign_objective), auth.uid())
  returning id into new_campaign_id;

  insert into public.bookings (
    campaign_id, creator_workspace_id, deliverable_description,
    desired_publish_date, notes, price_cents, currency
  ) values (
    new_campaign_id, p_creator_workspace_id, trim(p_deliverable_description),
    p_desired_publish_date, nullif(trim(p_company_notes), ''), 0, 'EUR'
  ) returning id into new_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, to_status)
  values (new_booking_id, auth.uid(), 'request_created', 'pending');

  return new_booking_id;
end;
$$;

revoke insert on public.campaigns from authenticated;
revoke insert on public.bookings from authenticated;
revoke insert on public.booking_events from authenticated;
grant execute on function public.create_booking_request(uuid, text, text, text, date, text) to authenticated;
