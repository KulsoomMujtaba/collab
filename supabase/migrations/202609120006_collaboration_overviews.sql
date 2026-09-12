create function public.get_collaboration_overview()
returns table (
  booking_id uuid, booking_status public.booking_status, campaign_title text,
  desired_publish_date date, price_cents integer, currency char(3), created_at timestamptz,
  deliverable_public_url text, payment_status public.payment_status,
  payment_funded_at timestamptz, payment_released_at timestamptz,
  payment_received_at timestamptz, viewer_role public.account_role,
  counterpart_name text, counterpart_detail text, counterpart_avatar_url text,
  last_message_body text, last_message_sender_name text, last_message_at timestamptz
)
language sql
stable
security definer set search_path = ''
as $$
  select b.id, b.status, c.title, b.desired_publish_date, b.price_cents,
    b.currency, b.created_at, d.public_url, bp.status, bp.funded_at,
    bp.released_at, bp.received_at,
    case when cp.user_id = auth.uid() then 'creator'::public.account_role
      else 'company'::public.account_role end,
    case when cp.user_id = auth.uid() then cw.name else cp.display_name end,
    case when cp.user_id = auth.uid() then coalesce(company.description, '') else cp.headline end,
    case when cp.user_id = auth.uid() then company.logo_url else cp.avatar_url end,
    latest.body, latest.sender_name, latest.created_at
  from public.bookings b
  join public.campaigns c on c.id = b.campaign_id
  join public.workspaces cw on cw.id = c.company_workspace_id
  join public.company_profiles company on company.workspace_id = c.company_workspace_id
  join public.creator_profiles cp on cp.workspace_id = b.creator_workspace_id
  left join public.deliverables d on d.booking_id = b.id
  left join public.booking_payments bp on bp.booking_id = b.id
  left join lateral (
    select m.body, coalesce(sender_creator.display_name, sender.full_name) as sender_name,
      m.created_at
    from public.booking_messages m
    join public.profiles sender on sender.id = m.sender_id
    left join public.creator_profiles sender_creator on sender_creator.user_id = m.sender_id
    where m.booking_id = b.id
    order by m.created_at desc
    limit 1
  ) latest on true
  where b.status in ('accepted', 'submitted', 'completed', 'cancelled')
    and (
      cp.user_id = auth.uid()
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = c.company_workspace_id and wm.user_id = auth.uid()
      )
    )
  order by coalesce(latest.created_at, b.updated_at) desc;
$$;

revoke execute on function public.get_collaboration_overview() from public, anon;
grant execute on function public.get_collaboration_overview() to authenticated;
