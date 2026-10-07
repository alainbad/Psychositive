/** Server adapters must implement these contracts. Never pass provider secrets to Vite. */
export interface PaymentProvider {
 createCheckout(input:{appointmentId:string;amountMinor:number;currency:string;idempotencyKey:string}):Promise<{checkoutUrl:string;reference:string}>;
 verifyWebhook(rawBody:string,signature:string):Promise<{eventId:string;reference:string;status:'paid'|'failed'|'refunded'}>;
 refund(reference:string,idempotencyKey:string):Promise<void>;
}
export interface VideoProvider {
 createPrivateRoom(input:{appointmentId:string;expiresAt:string}):Promise<{roomId:string}>;
 issueParticipantToken(input:{roomId:string;userId:string;expiresAt:string;audioOnly:boolean}):Promise<{url:string}>;
}
export interface EmailProvider {
 send(input:{to:string;template:'confirmation'|'reminder'|'cancellation';appointmentTime:string;portalUrl:string;idempotencyKey:string}):Promise<{messageId:string}>;
}
