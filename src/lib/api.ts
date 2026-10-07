import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
export async function request(action: string, payload: Record<string, unknown> = {}) {
  if (!supabase) throw new Error('The practice is not accepting online bookings yet. Please check back soon.');
  const { data, error } = await supabase.functions.invoke('practice-api', { body: { action, ...payload } });
  if (error || data?.error) throw new Error(data?.error || error?.message || 'Unable to complete request.');
  return data;
}
export type Appointment = { id: string; starts_at: string; ends_at: string; status: string; mode: string; client_id: string };
