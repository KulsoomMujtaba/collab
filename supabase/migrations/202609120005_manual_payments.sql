create type public.payment_status as enum ('awaiting_deposit', 'held', 'released', 'received');

create table public.booking_payments (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  status public.payment_status not null default 'awaiting_deposit',
  funded_by uuid references public.profiles(id),
  funded_at timestamptz,
  released_by uuid references public.profiles(id),
  released_at timestamptz,
  received_by uuid references public.profiles(id),
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'awaiting_deposit' and funded_by is null and funded_at is null and released_by is null and released_at is null and received_by is null and received_at is null)
    or (status = 'held' and funded_by is not null and funded_at is not null and released_by is null and released_at is null and received_by is null and received_at is null)
    or (status = 'released' and funded_by is not null and funded_at is not null and released_by is not null and released_at is not null and received_by is null and received_at is null)
    or (status = 'received' and funded_by is not null and funded_at is not null and released_by is not null and released_at is not null and received_by is not null and received_at is not null)
  )
);

create trigger booking_payments_updated_at before update on public.booking_payments
for each row execute function public.set_updated_at();

alter table public.booking_payments enable row level security;

create policy "payments booking participants select" on public.booking_payments
for select to authenticated using (
  public.is_workspace_member(public.booking_company_workspace(booking_id))
  or public.is_workspace_member(public.booking_creator_workspace(booking_id))
);

create function public.initialize_booking_payment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from new.status then
    insert into public.booking_payments (booking_id) values (new.id)
    on conflict (booking_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger bookings_initialize_payment
after update of status on public.bookings
for each row execute function public.initialize_booking_payment();

insert into public.booking_payments (booking_id, status, funded_by, funded_at, released_by, released_at)
select b.id,
  case when b.status = 'completed' then 'released'::public.payment_status else 'held'::public.payment_status end,
  c.created_by, coalesce(b.responded_at, b.created_at),
  case when b.status = 'completed' then c.created_by else null end,
  case when b.status = 'completed' then coalesce(b.completed_at, b.updated_at) else null end
from public.bookings b
join public.campaigns c on c.id = b.campaign_id
where b.status in ('submitted', 'completed')
on conflict (booking_id) do nothing;

insert into public.booking_payments (booking_id)
select id from public.bookings where status = 'accepted'
on conflict (booking_id) do nothing;

drop function public.get_creator_booking_inbox();
drop function public.get_company_booking_outbox();

create function public.get_creator_booking_inbox()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, deliverable_public_url text,
  deliverable_submitted_at timestamptz, completed_at timestamptz,
  payment_status public.payment_status, company_name text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, d.public_url, d.submitted_at, b.completed_at, bp.status, w.name
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  join public.campaigns c on c.id = b.campaign_id
  join public.workspaces w on w.id = c.company_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  left join public.booking_payments bp on bp.booking_id = b.id
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
  payment_status public.payment_status, creator_workspace_id uuid, creator_name text,
  creator_headline text, creator_avatar_url text
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, d.public_url, d.submitted_at, b.completed_at, bp.status,
    cp.workspace_id, cp.display_name, cp.headline, cp.avatar_url
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspace_members wm on wm.workspace_id = c.company_workspace_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  left join public.booking_payments bp on bp.booking_id = b.id
  where wm.user_id = auth.uid()
  order by b.created_at desc;
$$;

create function public.get_booking_payment(p_booking_id uuid)
returns table (
  booking_id uuid, payment_status public.payment_status,
  funded_at timestamptz, released_at timestamptz, received_at timestamptz
)
language sql
stable
security definer set search_path = ''
as $$
  select bp.booking_id, bp.status, bp.funded_at, bp.released_at, bp.received_at
  from public.booking_payments bp
  where bp.booking_id = p_booking_id
    and (
      public.is_workspace_member(public.booking_company_workspace(bp.booking_id))
      or public.is_workspace_member(public.booking_creator_workspace(bp.booking_id))
    );
$$;

create function public.fund_booking_payment(p_booking_id uuid)
returns public.payment_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_payment_status public.payment_status;
begin
  select bp.status into current_payment_status
  from public.booking_payments bp
  join public.bookings b on b.id = bp.booking_id
  join public.campaigns c on c.id = b.campaign_id
  where bp.booking_id = p_booking_id and b.status = 'accepted'
    and public.is_workspace_member(c.company_workspace_id)
  for update of bp;

  if current_payment_status is null then raise exception 'Payment record not found'; end if;
  if current_payment_status <> 'awaiting_deposit' then raise exception 'Funds have already been marked as deposited'; end if;

  update public.booking_payments
  set status = 'held', funded_by = auth.uid(), funded_at = now()
  where booking_id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, metadata)
  values (p_booking_id, auth.uid(), 'payment_funded', jsonb_build_object('payment_from', 'awaiting_deposit', 'payment_to', 'held'));
  return 'held';
end;
$$;

create function public.undo_booking_payment_funding(p_booking_id uuid)
returns public.payment_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_payment_status public.payment_status;
begin
  select bp.status into current_payment_status
  from public.booking_payments bp
  join public.bookings b on b.id = bp.booking_id
  join public.campaigns c on c.id = b.campaign_id
  where bp.booking_id = p_booking_id and b.status = 'accepted'
    and public.is_workspace_member(c.company_workspace_id)
    and not exists (select 1 from public.deliverables d where d.booking_id = b.id)
  for update of bp;

  if current_payment_status is null then raise exception 'Payment record not found'; end if;
  if current_payment_status <> 'held' then raise exception 'Only held funds can be undone'; end if;

  update public.booking_payments
  set status = 'awaiting_deposit', funded_by = null, funded_at = null
  where booking_id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, metadata)
  values (p_booking_id, auth.uid(), 'payment_funding_reverted', jsonb_build_object('payment_from', 'held', 'payment_to', 'awaiting_deposit'));
  return 'awaiting_deposit';
end;
$$;

create function public.confirm_booking_payment_received(p_booking_id uuid)
returns public.payment_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_payment_status public.payment_status;
begin
  select bp.status into current_payment_status
  from public.booking_payments bp
  join public.bookings b on b.id = bp.booking_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  where bp.booking_id = p_booking_id and b.status = 'completed'
    and cp.user_id = auth.uid()
  for update of bp;

  if current_payment_status is null then raise exception 'Payment record not found'; end if;
  if current_payment_status <> 'released' then raise exception 'Payment must be released before it can be confirmed'; end if;

  update public.booking_payments
  set status = 'received', received_by = auth.uid(), received_at = now()
  where booking_id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, metadata)
  values (p_booking_id, auth.uid(), 'payment_received', jsonb_build_object('payment_from', 'released', 'payment_to', 'received'));
  return 'received';
end;
$$;

create or replace function public.submit_booking_deliverable(p_booking_id uuid, p_public_url text)
returns public.booking_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status public.booking_status;
  current_payment_status public.payment_status;
  clean_url text := trim(p_public_url);
begin
  if clean_url !~* '^https?://([a-z0-9-]+\.)*linkedin\.com/.+' then
    raise exception 'Enter a valid public LinkedIn URL';
  end if;

  select b.status, bp.status into current_status, current_payment_status
  from public.bookings b
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  join public.booking_payments bp on bp.booking_id = b.id
  where b.id = p_booking_id and cp.user_id = auth.uid()
  for update of b, bp;

  if current_status is null then raise exception 'Booking not found'; end if;
  if current_status <> 'accepted' then raise exception 'Only accepted bookings can receive a deliverable'; end if;
  if current_payment_status <> 'held' then raise exception 'Funds must be held before submitting the deliverable'; end if;

  insert into public.deliverables (booking_id, public_url, submitted_by)
  values (p_booking_id, clean_url, auth.uid());
  update public.bookings set status = 'submitted', submitted_at = now() where id = p_booking_id;
  insert into public.booking_events (booking_id, actor_id, event_type, from_status, to_status)
  values (p_booking_id, auth.uid(), 'deliverable_submitted', current_status, 'submitted');
  return 'submitted';
end;
$$;

create or replace function public.complete_booking(p_booking_id uuid)
returns public.booking_status
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status public.booking_status;
  current_payment_status public.payment_status;
begin
  select b.status, bp.status into current_status, current_payment_status
  from public.bookings b
  join public.booking_payments bp on bp.booking_id = b.id
  join public.campaigns c on c.id = b.campaign_id
  join public.workspace_members wm on wm.workspace_id = c.company_workspace_id
  where b.id = p_booking_id and wm.user_id = auth.uid()
  for update of b, bp;

  if current_status is null then raise exception 'Booking not found'; end if;
  if current_status <> 'submitted' then raise exception 'Only submitted bookings can be completed'; end if;
  if current_payment_status <> 'held' then raise exception 'Funds must be held before completion'; end if;
  if not exists (select 1 from public.deliverables where booking_id = p_booking_id) then raise exception 'This booking has no deliverable'; end if;

  update public.bookings set status = 'completed', completed_at = now() where id = p_booking_id;
  update public.booking_payments set status = 'released', released_by = auth.uid(), released_at = now() where booking_id = p_booking_id;
  insert into public.booking_events (booking_id, actor_id, event_type, from_status, to_status)
  values (p_booking_id, auth.uid(), 'collaboration_completed', current_status, 'completed');
  insert into public.booking_events (booking_id, actor_id, event_type, metadata)
  values (p_booking_id, auth.uid(), 'payment_released', jsonb_build_object('payment_from', 'held', 'payment_to', 'released'));
  return 'completed';
end;
$$;

revoke all on public.booking_payments from anon, authenticated;
revoke execute on function public.initialize_booking_payment() from public, anon, authenticated;
revoke execute on function public.get_booking_payment(uuid) from public, anon;
revoke execute on function public.fund_booking_payment(uuid) from public, anon;
revoke execute on function public.undo_booking_payment_funding(uuid) from public, anon;
revoke execute on function public.confirm_booking_payment_received(uuid) from public, anon;
revoke execute on function public.get_creator_booking_inbox() from public, anon;
revoke execute on function public.get_company_booking_outbox() from public, anon;
grant execute on function public.get_booking_payment(uuid) to authenticated;
grant execute on function public.fund_booking_payment(uuid) to authenticated;
grant execute on function public.undo_booking_payment_funding(uuid) to authenticated;
grant execute on function public.confirm_booking_payment_received(uuid) to authenticated;
grant execute on function public.get_creator_booking_inbox() to authenticated;
grant execute on function public.get_company_booking_outbox() to authenticated;
