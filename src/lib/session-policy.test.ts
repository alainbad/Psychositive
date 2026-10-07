import {describe,it,expect} from 'vitest';
import {canJoinSession} from '../../supabase/functions/_shared/session-policy';
const a={client_id:'alice',practitioner_id:'hala',status:'confirmed',starts_at:'2026-10-10T10:00:00Z',ends_at:'2026-10-10T11:00:00Z'};
const at=(time:string)=>Date.parse('2026-10-10T'+time+'Z');
describe('session authorization',()=>{
 it('allows only the client and assigned practitioner during the window',()=>{expect(canJoinSession(a,'alice',at('10:30:00'))).toBe(true);expect(canJoinSession(a,'hala',at('10:30:00'))).toBe(true);expect(canJoinSession(a,'bob',at('10:30:00'))).toBe(false)});
 it('rejects unpaid or cancelled appointments',()=>{for(const status of ['pending','cancelled','completed'])expect(canJoinSession({...a,status},'alice',at('10:30:00'))).toBe(false)});
 it('enforces the exact early and late boundaries',()=>{expect(canJoinSession(a,'alice',at('09:49:59'))).toBe(false);expect(canJoinSession(a,'alice',at('09:50:00'))).toBe(true);expect(canJoinSession(a,'alice',at('11:10:01'))).toBe(false)});
 it('fails closed on invalid dates',()=>{expect(canJoinSession({...a,starts_at:'invalid'},'alice')).toBe(false)});
});
