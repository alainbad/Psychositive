import { createClient } from '@supabase/supabase-js';
const url='https://ufmrvvpjlppaoksucmfn.supabase.co';
// Publishable key only; privileged keys stay inside the Edge Function.
const key=import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_HhlEj3OCBflEjJBDvveKLA_tov3OBRU';
let client: ReturnType<typeof createClient> | undefined;
export function getSupabase() {
 if(!key)throw new Error('Booking configuration is not installed.');
 return client ??=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
}
export type Slot={starts_at:string;ends_at:string};
export type Reservation=Slot & {id:string;session_type_id:string;format:string;status:string};
export type AvailabilityWindow=Slot & {id:string};
export async function scheduling<T>(action:string,payload:Record<string,unknown>={}):Promise<T> {
 const db=getSupabase();
 const {data:{session}}=await db.auth.getSession();
 const response=await fetch(`${url}/functions/v1/reservations`,{method:'POST',headers:{'Content-Type':'application/json','apikey':key!,...(session?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify({action,...payload})});
 const data=await response.json();
 if(!response.ok||data.error)throw new Error(data.error||'Unable to complete request.');
 return data as T;
}
export function localDateKey(iso:string) {
 const d=new Date(iso);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function slotLabel(slot:Slot) {
 const opts:Intl.DateTimeFormatOptions={hour:'2-digit',minute:'2-digit',hour12:false};
 return `${new Date(slot.starts_at).toLocaleTimeString('en-GB',opts)}–${new Date(slot.ends_at).toLocaleTimeString('en-GB',opts)}`;
}
export function slotsForDate(slots:Slot[],date:string) {return slots.filter(s=>localDateKey(s.starts_at)===date);}
