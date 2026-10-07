export type SessionAppointment = {client_id:string;practitioner_id:string;status:string;starts_at:string;ends_at:string};
export function canJoinSession(a:SessionAppointment,userId:string,now=Date.now()):boolean {
 const start=Date.parse(a.starts_at),end=Date.parse(a.ends_at);
 return [a.client_id,a.practitioner_id].includes(userId)&&a.status==='confirmed'&&Number.isFinite(start)&&Number.isFinite(end)&&end>start&&now>=start-600000&&now<=end+600000;
}
