-- Appointment scheduling only. No intake answers or clinical records in these tables.
create schema if not exists scheduling_private;
revoke all on schema scheduling_private from public, anon, authenticated;
grant usage on schema scheduling_private to service_role;
create table public.session_types (
 id text primary key, name text not null, duration_minutes integer not null check(duration_minutes in (30,45)), formats text[] not null, enabled boolean not null default true
);
insert into public.session_types values
 ('initial-consultation','Initial consultation',30,array['Video','Audio'],true),
 ('individual-session','Individual session',45,array['Video','Audio'],true),
 ('audio-session','Audio session',45,array['Audio'],true);
create table public.availability_windows (
 id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz not null,
 created_at timestamptz not null default now(), check(ends_at > starts_at and ends_at <= starts_at + interval '24 hours')
);
create table public.reservations (
 id uuid primary key default gen_random_uuid(), client_id uuid not null references auth.users(id),
 session_type_id text not null references public.session_types(id), starts_at timestamptz not null, ends_at timestamptz not null,
 format text not null check(format in ('Video','Audio')), status text not null default 'requested' check(status in ('requested','confirmed','cancelled','completed')),
 idempotency_key uuid not null, consent_version text not null, consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at > starts_at), unique(client_id,idempotency_key),
 exclude using gist (tstzrange(starts_at,ends_at,'[)') with &&) where (status in ('requested','confirmed'))
);
create index reservations_client on public.reservations(client_id,starts_at);
create table scheduling_private.admins (user_id uuid primary key references auth.users(id));
create table scheduling_private.settings (
 singleton boolean primary key default true check(singleton), lead_hours integer not null default 2 check(lead_hours between 0 and 168),
 horizon_days integer not null default 90 check(horizon_days between 1 and 365), cancellation_hours integer not null default 24 check(cancellation_hours between 0 and 168)
);
insert into scheduling_private.settings(singleton) values(true);
create table scheduling_private.audit (
 id bigint generated always as identity primary key, actor_id uuid references auth.users(id), reservation_id uuid,
 event text not null, created_at timestamptz not null default now()
);
alter table public.session_types enable row level security;
alter table public.availability_windows enable row level security;
alter table public.reservations enable row level security;
alter table scheduling_private.admins enable row level security;
alter table scheduling_private.settings enable row level security;
alter table scheduling_private.audit enable row level security;
revoke all on public.session_types,public.availability_windows,public.reservations from anon,authenticated;
grant select on public.session_types to anon,authenticated;
create policy session_types_read on public.session_types for select to anon,authenticated using(enabled);
grant select on public.reservations to authenticated;
create policy own_reservations on public.reservations for select to authenticated using(client_id=(select auth.uid()));
grant all on public.session_types,public.availability_windows,public.reservations to service_role;
grant all on all tables in schema scheduling_private to service_role;
grant usage,select on all sequences in schema scheduling_private to service_role;

-- These RPCs are service-only SECURITY INVOKER. The Edge Function validates the user.
create function public.available_session_slots(p_session text,p_from timestamptz,p_until timestamptz)
returns table(starts_at timestamptz,ends_at timestamptz)
language sql stable security invoker set search_path='' as $$
 select distinct t.start_at,t.start_at+make_interval(mins=>s.duration_minutes)
 from public.availability_windows w
 join public.session_types s on s.id=p_session and s.enabled
 cross join scheduling_private.settings cfg
 cross join lateral generate_series(w.starts_at,w.ends_at-make_interval(mins=>s.duration_minutes),interval '15 minutes') t(start_at)
 where p_until > p_from and p_until <= p_from+interval '35 days'
 and t.start_at >= greatest(p_from,now()+make_interval(hours=>cfg.lead_hours))
 and t.start_at < least(p_until,now()+make_interval(days=>cfg.horizon_days))
 and not exists(select 1 from public.reservations r where r.status in ('requested','confirmed')
 and tstzrange(r.starts_at,r.ends_at,'[)') && tstzrange(t.start_at,t.start_at+make_interval(mins=>s.duration_minutes),'[)'))
 order by 1;
$$;
create function public.request_reservation(p_client uuid,p_session text,p_start timestamptz,p_format text,p_key uuid,p_consent text)
returns public.reservations language plpgsql security invoker set search_path='' as $$
declare s public.session_types; cfg scheduling_private.settings; result public.reservations; win public.availability_windows; finish timestamptz;
begin
 if p_client is null or p_key is null or p_consent is distinct from 'scheduling-v1' then raise exception 'Invalid reservation request'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_client::text,0));
 select * into result from public.reservations where client_id=p_client and idempotency_key=p_key;
 if found then
  if result.session_type_id<>p_session or result.starts_at<>p_start or result.format<>p_format then raise exception 'Request key already used'; end if;
  return result;
 end if;
 select * into s from public.session_types where id=p_session and enabled;
 if not found or not (p_format=any(s.formats)) then raise exception 'Invalid session or format'; end if;
 select * into cfg from scheduling_private.settings;
 if p_start is null or p_start < now()+make_interval(hours=>cfg.lead_hours) or p_start >= now()+make_interval(days=>cfg.horizon_days) then raise exception 'This time is unavailable'; end if;
 finish:=p_start+make_interval(mins=>s.duration_minutes);
 select * into win from public.availability_windows w where p_start>=w.starts_at and finish<=w.ends_at
 and mod(extract(epoch from(p_start-w.starts_at))::numeric,900)=0 limit 1 for share;
 if not found then raise exception 'This time is unavailable'; end if;
 if (select count(*) from public.reservations where client_id=p_client and status in ('requested','confirmed') and ends_at>now())>=5 then raise exception 'Maximum pending reservations reached'; end if;
 insert into public.reservations(client_id,session_type_id,starts_at,ends_at,format,idempotency_key,consent_version)
 values(p_client,p_session,p_start,finish,p_format,p_key,p_consent) returning * into result;
 insert into scheduling_private.audit(actor_id,reservation_id,event) values(p_client,result.id,'reservation.requested');
 return result;
exception when exclusion_violation then raise exception 'This time was just reserved. Please choose another.';
end;
$$;
create function public.cancel_reservation(p_client uuid,p_id uuid)
returns public.reservations language plpgsql security invoker set search_path='' as $$
declare result public.reservations; cutoff integer;
begin
 select * into result from public.reservations where id=p_id and client_id=p_client for update;
 if not found then raise exception 'Reservation not found'; end if;
 if result.status='cancelled' then return result; end if;
 select cancellation_hours into cutoff from scheduling_private.settings;
 if result.status not in ('requested','confirmed') or result.starts_at < now()+make_interval(hours=>cutoff) then raise exception 'Online cancellation is closed. Please contact the practice.'; end if;
 update public.reservations set status='cancelled',updated_at=now() where id=p_id returning * into result;
 insert into scheduling_private.audit(actor_id,reservation_id,event) values(p_client,result.id,'reservation.cancelled');
 return result;
end;
$$;
create function public.scheduling_is_admin(p_user uuid) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from scheduling_private.admins where user_id=p_user);
$$;
create function public.scheduling_policy() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('leadHours',lead_hours,'horizonDays',horizon_days,'cancellationHours',cancellation_hours) from scheduling_private.settings;
$$;
revoke all on function public.available_session_slots(text,timestamptz,timestamptz),public.request_reservation(uuid,text,timestamptz,text,uuid,text),public.cancel_reservation(uuid,uuid),public.scheduling_is_admin(uuid),public.scheduling_policy() from public,anon,authenticated;
grant execute on function public.available_session_slots(text,timestamptz,timestamptz),public.request_reservation(uuid,text,timestamptz,text,uuid,text),public.cancel_reservation(uuid,uuid),public.scheduling_is_admin(uuid),public.scheduling_policy() to service_role;
create function public.admin_reservation_status(p_actor uuid,p_id uuid,p_status text)
returns public.reservations language plpgsql security invoker set search_path='' as $$
declare result public.reservations;
begin
 if not exists(select 1 from scheduling_private.admins where user_id=p_actor) then raise exception 'Access denied'; end if;
 select * into result from public.reservations where id=p_id for update;
 if not found then raise exception 'Reservation not found'; end if;
 if not ((result.status='requested' and p_status in ('confirmed','cancelled')) or (result.status='confirmed' and p_status in ('cancelled','completed'))) then raise exception 'Invalid status transition'; end if;
 update public.reservations set status=p_status,updated_at=now() where id=p_id returning * into result;
 insert into scheduling_private.audit(actor_id,reservation_id,event) values(p_actor,p_id,'reservation.'||p_status);
 return result;
end;
$$;
revoke all on function public.admin_reservation_status(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_reservation_status(uuid,uuid,text) to service_role;
