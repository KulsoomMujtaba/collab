create table public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index booking_messages_thread_idx on public.booking_messages (booking_id, created_at);

alter table public.booking_messages enable row level security;

create policy "messages booking participants select" on public.booking_messages
for select to authenticated using (
  public.is_workspace_member(public.booking_company_workspace(booking_id))
  or public.is_workspace_member(public.booking_creator_workspace(booking_id))
);

create function public.get_booking_detail(p_booking_id uuid)
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  campaign_objective text, deliverable_description text, desired_publish_date date,
  company_notes text, price_cents integer, currency char(3), created_at timestamptz,
  responded_at timestamptz, deliverable_public_url text,
  deliverable_submitted_at timestamptz, completed_at timestamptz,
  company_name text, creator_name text, creator_headline text,
  creator_avatar_url text, viewer_role public.account_role
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, c.objective, b.deliverable_description,
    b.desired_publish_date, b.notes, b.price_cents, b.currency, b.created_at,
    b.responded_at, d.public_url, d.submitted_at, b.completed_at, cw.name,
    cp.display_name, cp.headline, cp.avatar_url,
    case when cp.user_id = auth.uid() then 'creator'::public.account_role
      else 'company'::public.account_role end
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspaces cw on cw.id = c.company_workspace_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  where b.id = p_booking_id
    and (
      cp.user_id = auth.uid()
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = c.company_workspace_id and wm.user_id = auth.uid()
      )
    );
$$;

create function public.get_booking_messages(p_booking_id uuid)
returns table (
  message_id uuid, sender_id uuid, sender_name text, sender_role public.account_role,
  body text, created_at timestamptz
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not (
    public.is_workspace_member(public.booking_company_workspace(p_booking_id))
    or public.is_workspace_member(public.booking_creator_workspace(p_booking_id))
  ) then
    raise exception 'Booking not found';
  end if;

  return query
  select m.id, m.sender_id, coalesce(cp.display_name, p.full_name), p.role,
    m.body, m.created_at
  from public.booking_messages m
  join public.profiles p on p.id = m.sender_id
  left join public.creator_profiles cp on cp.user_id = m.sender_id
  where m.booking_id = p_booking_id
  order by m.created_at asc;
end;
$$;

create function public.send_booking_message(p_booking_id uuid, p_body text)
returns table (
  message_id uuid, sender_id uuid, sender_name text, sender_role public.account_role,
  body text, created_at timestamptz
)
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status public.booking_status;
  clean_body text := trim(p_body);
  new_message_id uuid;
  sent_at timestamptz;
begin
  if char_length(clean_body) < 1 or char_length(clean_body) > 2000 then
    raise exception 'Messages must be between 1 and 2,000 characters';
  end if;

  select b.status into current_status
  from public.bookings b
  where b.id = p_booking_id
    and (
      public.is_workspace_member(public.booking_company_workspace(b.id))
      or public.is_workspace_member(public.booking_creator_workspace(b.id))
    )
  for update;

  if current_status is null then
    raise exception 'Booking not found';
  end if;
  if current_status not in ('accepted', 'submitted', 'completed') then
    raise exception 'Messaging is not available for this booking';
  end if;

  insert into public.booking_messages (booking_id, sender_id, body)
  values (p_booking_id, auth.uid(), clean_body)
  returning id, booking_messages.created_at into new_message_id, sent_at;

  return query
  select new_message_id, p.id, coalesce(cp.display_name, p.full_name), p.role,
    clean_body, sent_at
  from public.profiles p
  left join public.creator_profiles cp on cp.user_id = p.id
  where p.id = auth.uid();
end;
$$;

revoke all on public.booking_messages from anon, authenticated;
revoke execute on function public.get_booking_detail(uuid) from public, anon;
revoke execute on function public.get_booking_messages(uuid) from public, anon;
revoke execute on function public.send_booking_message(uuid, text) from public, anon;
grant execute on function public.get_booking_detail(uuid) to authenticated;
grant execute on function public.get_booking_messages(uuid) to authenticated;
grant execute on function public.send_booking_message(uuid, text) to authenticated;
