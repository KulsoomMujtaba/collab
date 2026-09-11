create function public.get_creator_booking_inbox()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, company_name text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, w.name
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  join public.campaigns c on c.id = b.campaign_id
  join public.workspaces w on w.id = c.company_workspace_id
  where cp.user_id = auth.uid()
  order by b.created_at desc;
$$;

create function public.get_company_booking_outbox()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, creator_workspace_id uuid, creator_name text,
  creator_headline text, creator_avatar_url text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, cp.workspace_id, cp.display_name, cp.headline, cp.avatar_url
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspace_members wm on wm.workspace_id = c.company_workspace_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  where wm.user_id = auth.uid()
  order by b.created_at desc;
$$;

create function public.respond_to_booking(p_booking_id uuid, p_decision text)
returns public.booking_status
language plpgsql
security definer set search_path = ''
as $$
declare
  next_status public.booking_status;
  current_status public.booking_status;
begin
  if p_decision not in ('accepted', 'declined') then
    raise exception 'Decision must be accepted or declined';
  end if;
  next_status := p_decision::public.booking_status;

  select b.status into current_status
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  where b.id = p_booking_id and cp.user_id = auth.uid()
  for update of b;

  if current_status is null then
    raise exception 'Booking not found';
  end if;
  if current_status <> 'pending' then
    raise exception 'This request has already been answered';
  end if;

  update public.bookings
  set status = next_status, responded_at = now()
  where id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, from_status, to_status)
  values (p_booking_id, auth.uid(), 'creator_responded', current_status, next_status);

  return next_status;
end;
$$;

revoke update on public.bookings from authenticated;
revoke execute on function public.get_creator_booking_inbox() from public, anon;
revoke execute on function public.get_company_booking_outbox() from public, anon;
revoke execute on function public.respond_to_booking(uuid, text) from public, anon;
grant execute on function public.get_creator_booking_inbox() to authenticated;
grant execute on function public.get_company_booking_outbox() to authenticated;
grant execute on function public.respond_to_booking(uuid, text) to authenticated;
