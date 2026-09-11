drop function public.get_creator_booking_inbox();
drop function public.get_company_booking_outbox();

create function public.get_creator_booking_inbox()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, deliverable_public_url text,
  deliverable_submitted_at timestamptz, completed_at timestamptz, company_name text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, d.public_url, d.submitted_at, b.completed_at, w.name
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  join public.campaigns c on c.id = b.campaign_id
  join public.workspaces w on w.id = c.company_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  where cp.user_id = auth.uid()
  order by b.created_at desc;
$$;

create function public.get_company_booking_outbox()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, deliverable_public_url text,
  deliverable_submitted_at timestamptz, completed_at timestamptz,
  creator_workspace_id uuid, creator_name text, creator_headline text,
  creator_avatar_url text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, d.public_url, d.submitted_at, b.completed_at,
    cp.workspace_id, cp.display_name, cp.headline, cp.avatar_url
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspace_members wm on wm.workspace_id = c.company_workspace_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  where wm.user_id = auth.uid()
  order by b.created_at desc;
$$;

create function public.submit_booking_deliverable(p_booking_id uuid, p_public_url text)
returns public.booking_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status public.booking_status;
  clean_url text := trim(p_public_url);
begin
  if clean_url !~* '^https?://([a-z0-9-]+\.)*linkedin\.com/.+' then
    raise exception 'Enter a valid public LinkedIn URL';
  end if;

  select b.status into current_status
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  where b.id = p_booking_id and cp.user_id = auth.uid()
  for update of b;

  if current_status is null then
    raise exception 'Booking not found';
  end if;
  if current_status <> 'accepted' then
    raise exception 'Only accepted bookings can receive a deliverable';
  end if;

  insert into public.deliverables (booking_id, public_url, submitted_by)
  values (p_booking_id, clean_url, auth.uid());

  update public.bookings
  set status = 'submitted', submitted_at = now()
  where id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, from_status, to_status)
  values (p_booking_id, auth.uid(), 'deliverable_submitted', current_status, 'submitted');

  return 'submitted';
end;
$$;

create function public.complete_booking(p_booking_id uuid)
returns public.booking_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status public.booking_status;
begin
  select b.status into current_status
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspace_members wm on wm.workspace_id = c.company_workspace_id
  where b.id = p_booking_id and wm.user_id = auth.uid()
  for update of b;

  if current_status is null then
    raise exception 'Booking not found';
  end if;
  if current_status <> 'submitted' then
    raise exception 'Only submitted bookings can be completed';
  end if;
  if not exists (select 1 from public.deliverables where booking_id = p_booking_id) then
    raise exception 'This booking has no deliverable';
  end if;

  update public.bookings
  set status = 'completed', completed_at = now()
  where id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, from_status, to_status)
  values (p_booking_id, auth.uid(), 'collaboration_completed', current_status, 'completed');

  return 'completed';
end;
$$;

revoke insert, update, delete on public.deliverables from authenticated;
revoke execute on function public.get_creator_booking_inbox() from public, anon;
revoke execute on function public.get_company_booking_outbox() from public, anon;
revoke execute on function public.submit_booking_deliverable(uuid, text) from public, anon;
revoke execute on function public.complete_booking(uuid) from public, anon;
grant execute on function public.get_creator_booking_inbox() to authenticated;
grant execute on function public.get_company_booking_outbox() to authenticated;
grant execute on function public.submit_booking_deliverable(uuid, text) to authenticated;
grant execute on function public.complete_booking(uuid) to authenticated;
