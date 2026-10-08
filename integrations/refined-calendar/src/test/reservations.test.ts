import {describe,it,expect} from 'vitest';
import {localDateKey,slotsForDate,slotLabel} from '../lib/reservations';
describe('Reservation times in the client timezone',()=>{
 it('keeps the full session range',()=>{
  const s={starts_at:'2026-10-20T05:00:00Z',ends_at:'2026-10-20T05:45:00Z'};
  const label=slotLabel(s).split('–');
  expect(label).toHaveLength(2);
  const minutes=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3));
  expect(minutes(label[1]!)-minutes(label[0]!)).toBe(45);
 });
 it('groups slots by local date rather than their UTC date',()=>{
  const s={starts_at:'2026-10-20T23:30:00Z',ends_at:'2026-10-21T00:00:00Z'};
  expect(slotsForDate([s],localDateKey(s.starts_at))).toEqual([s]);
  expect(slotsForDate([s],'2000-01-01')).toEqual([]);
 });
});
