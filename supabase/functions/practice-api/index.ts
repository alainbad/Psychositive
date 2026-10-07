import { canJoinSession } from '../_shared/session-policy.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const origin = Deno.env.get('APP_ORIGIN') || '';
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary':'Origin' };
function json(data: unknown, status=200) { return new Response(JSON.stringify(data), {status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}}); }
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 if(origin && req.headers.get('origin') && req.headers.get('origin')!==origin) return json({error:'Origin not allowed'},403);
 try {
  const {action,...payload}=await req.json();
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  if(action==='availability') {
   if(!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) return json({error:'Invalid date'},400);
   // Public launch gate remains closed until providers, consent and policies are configured.
   return json({slots:[],accepting_bookings:false});
  }
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
  if(!token)return json({error:'Authentication required'},401);
  const {data:{user},error}=await db.auth.getUser(token);
  if(error||!user||user.is_anonymous)return json({error:'Authentication required'},401);
  // Staff privileges are not derived from user-editable metadata.
  // private schema is intentionally not exposed to PostgREST; database access layer must be
  // deployed with a dedicated connection/RPC before admin operations are enabled.
  if(action==='admin-status') return json({authorized:false});
  if(action==='join-session') {
   const {data:appointment,error:readError}=await db.from('appointments').select('*').eq('id',payload.appointment_id).single();
   if(readError||!appointment||![appointment.client_id,appointment.practitioner_id].includes(user.id))return json({error:'Appointment not found'},404);
   if(appointment.status!=='confirmed')return json({error:'The appointment is not confirmed'},409);
   if(!canJoinSession(appointment,user.id))return json({error:'The session room is not open yet, or has closed.'},403);
   return json({error:'Secure session provider is not configured. Contact the practice.'},503);
  }
  return json({error:'This feature is not enabled yet.'},503);
 }catch{return json({error:'Unable to process request.'},400)}
});
