import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso = (value:unknown) => typeof value==='string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
// CORS does not authorize a request. Every private operation validates its bearer token below.
Deno.serve(async req => {
 const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try {
  if(Number(req.headers.get('content-length'))>8192)return reply({error:'Request too large'},413);
  const raw=await req.text(); if(raw.length>8192)return reply({error:'Request too large'},413);
  const b=JSON.parse(raw); const action=b.action;
  if(action==='availability') {
   if(!['initial-consultation','individual-session','audio-session'].includes(b.session)||!iso(b.from)||!iso(b.until)||Date.parse(b.until)<=Date.parse(b.from)||Date.parse(b.until)-Date.parse(b.from)>35*86400000)return reply({error:'Invalid calendar range'},400);
   const {data,error}=await db.rpc('available_session_slots',{p_session:b.session,p_from:b.from,p_until:b.until}); if(error)throw error;
   const policy=await db.rpc('scheduling_policy'); if(policy.error)throw policy.error;
   return reply({slots:data,policy:policy.data});
  }
  const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if(!token)return reply({error:'Please sign in to continue'},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user||!user.email_confirmed_at)return reply({error:'Sign in with a verified email to continue'},401);
  if(action==='request') {
   if(!iso(b.start)||!uuid.test(b.key)||b.consent!==true)return reply({error:'Review the reservation details and consent'},400);
   const {data,error}=await db.rpc('request_reservation',{p_client:user.id,p_session:b.session,p_start:b.start,p_format:b.format,p_key:b.key,p_consent:'scheduling-v1'}); if(error)throw error;
   return reply({reservation:data});
  }
  if(action==='mine') {
   const {data,error}=await db.from('reservations').select('id,session_type_id,starts_at,ends_at,format,status').eq('client_id',user.id).order('starts_at',{ascending:false}).limit(100);if(error)throw error;
   const role=await db.rpc('scheduling_is_admin',{p_user:user.id});if(role.error)throw role.error;
   return reply({reservations:data,isAdmin:role.data});
  }
  if(action==='cancel') {
   if(!uuid.test(b.id))return reply({error:'Invalid reservation'},400);
   const {data,error}=await db.rpc('cancel_reservation',{p_client:user.id,p_id:b.id});if(error)throw error;return reply({reservation:data});
  }
  const {data:admin,error:roleError}=await db.rpc('scheduling_is_admin',{p_user:user.id});if(roleError)throw roleError;
  if(!admin)return reply({error:'Access denied'},403);
  if(action==='admin-status') {
   if(!uuid.test(b.id)||!['confirmed','cancelled','completed'].includes(b.status))return reply({error:'Invalid reservation update'},400);
   const {data,error}=await db.rpc('admin_reservation_status',{p_actor:user.id,p_id:b.id,p_status:b.status});if(error)throw error;return reply({reservation:data});
  }
  if(action==='admin-calendar') {
   const [windows,reservations]=await Promise.all([db.from('availability_windows').select('*').gte('ends_at',new Date().toISOString()).order('starts_at').limit(500),db.from('reservations').select('id,session_type_id,starts_at,ends_at,format,status').gte('ends_at',new Date().toISOString()).order('starts_at').limit(500)]);
   if(windows.error||reservations.error)throw windows.error||reservations.error;return reply({windows:windows.data,reservations:reservations.data});
  }
  if(action==='add-window') {
   if(!iso(b.start)||!iso(b.end)||Date.parse(b.start)<=Date.now()||Date.parse(b.end)<=Date.parse(b.start)||Date.parse(b.end)-Date.parse(b.start)>86400000)return reply({error:'Choose a future window of up to 24 hours'},400);
   const {data,error}=await db.from('availability_windows').insert({starts_at:b.start,ends_at:b.end}).select().single();if(error)throw error;return reply({window:data});
  }
  if(action==='remove-window') {
   if(!uuid.test(b.id))return reply({error:'Invalid window'},400);
   const {error}=await db.from('availability_windows').delete().eq('id',b.id);if(error)throw error;return reply({removed:true});
  }
  return reply({error:'Unknown action'},400);
 } catch(e) {
  const message=String((e as {message?:string})?.message||'Unable to complete request');
  const allowed=['This time is unavailable','This time was just reserved. Please choose another.','Maximum pending reservations reached','Reservation not found','Online cancellation is closed. Please contact the practice.','Invalid session or format','Request key already used'];
  return reply({error:allowed.includes(message)?message:'Unable to complete request. Please try again.'},400);
 }
});
