begin;
create temporary table test_context(a uuid,b uuid,r uuid,t timestamptz);
insert into test_context values(gen_random_uuid(),gen_random_uuid(),null,date_trunc('day',now())+interval '10 days 9 hours');
insert into auth.users(id) select a from test_context union all select b from test_context;
insert into public.availability_windows(starts_at,ends_at) select t,t+interval '3 hours' from test_context;
do $$
declare ctx test_context; result public.reservations; replay public.reservations; key uuid:=gen_random_uuid(); n integer;
begin
 select * into ctx from test_context;
 select count(*) into n from public.available_session_slots('initial-consultation',ctx.t,ctx.t+interval '1 day');
 if n<>11 then raise exception 'Expected 11 thirty-minute starts, got %',n; end if;
 select count(*) into n from public.available_session_slots('individual-session',ctx.t,ctx.t+interval '1 day');
 if n<>10 then raise exception 'Expected 10 forty-five-minute starts, got %',n; end if;
 result:=public.request_reservation(ctx.a,'individual-session',ctx.t,'Video',key,'scheduling-v1');
 if result.ends_at-result.starts_at<>interval '45 minutes' then raise exception 'Duration failed';end if;
 replay:=public.request_reservation(ctx.a,'individual-session',ctx.t,'Video',key,'scheduling-v1');
 if replay.id<>result.id then raise exception 'Idempotency failed';end if;
 update test_context set r=result.id;
 begin
  perform public.request_reservation(ctx.b,'initial-consultation',ctx.t+interval '15 minutes','Audio',gen_random_uuid(),'scheduling-v1');
  raise exception 'Overlapping reservation was allowed';
 exception when raise_exception then
  if sqlerrm <> 'This time was just reserved. Please choose another.' then raise;end if;
 end;
 if exists(select 1 from public.available_session_slots('initial-consultation',ctx.t,ctx.t+interval '1 day') where starts_at<ctx.t+interval '45 minutes') then raise exception 'Busy times leaked into availability';end if;
 begin
  perform public.request_reservation(ctx.b,'audio-session',ctx.t+interval '1 hour','Video',gen_random_uuid(),'scheduling-v1');
  raise exception 'Audio-only format bypassed';
 exception when raise_exception then if sqlerrm<>'Invalid session or format' then raise;end if;end;
 begin
  perform public.request_reservation(ctx.b,'individual-session',ctx.t+interval '2 hours 30 minutes','Video',gen_random_uuid(),'scheduling-v1');
  raise exception 'Window boundary bypassed';
 exception when raise_exception then if sqlerrm<>'This time is unavailable' then raise;end if;end;
 begin
  perform public.cancel_reservation(ctx.b,result.id);raise exception 'Other client cancellation allowed';
 exception when raise_exception then if sqlerrm<>'Reservation not found' then raise;end if;end;
 if has_function_privilege('authenticated','public.request_reservation(uuid,text,timestamptz,text,uuid,text)','execute') or has_function_privilege('anon','public.available_session_slots(text,timestamptz,timestamptz)','execute') then raise exception 'Service RPC publicly executable';end if;
 if has_table_privilege('anon','public.reservations','select') or has_table_privilege('authenticated','public.reservations','insert') then raise exception 'Reservation grants exposed';end if;
end;
$$;
select set_config('request.jwt.claim.sub',(select b::text from test_context),true);
set local role authenticated;
do $$begin if (select count(*) from public.reservations)<>0 then raise exception 'Client can view another reservation';end if;end;$$;
reset role;
select set_config('request.jwt.claim.sub',(select a::text from test_context),true);
set local role authenticated;
do $$begin if (select count(*) from public.reservations)<>1 then raise exception 'Client cannot see own reservation';end if;end;$$;
reset role;
do $$declare ctx test_context;begin
 select * into ctx from test_context;
 perform public.cancel_reservation(ctx.a,ctx.r);
 if not exists(select 1 from public.available_session_slots('individual-session',ctx.t,ctx.t+interval '1 day') where starts_at=ctx.t) then raise exception 'Cancellation did not release time';end if;
 if (select count(*) from scheduling_private.audit where reservation_id=ctx.r)<>2 then raise exception 'Audit missing';end if;
end;$$;
select 'PASS: duration, window fit, overlap rejection, idempotency, formats, ownership, RLS, restricted RPC, cancellation and audit' as result;
rollback;
