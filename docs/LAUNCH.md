# Implementation and launch plan

## Decisions required from the practice

- Verified professional title, qualifications, biography, portrait, registrations, permitted client locations, adult/minor scope and session languages.
- Session lengths, currency and fees, cancellation window, refund/no-show terms and availability/timezone.
- Dedicated Supabase project/region, domain, payment merchant, video provider and verified email sender.
- Reviewed privacy/terms/telehealth documents, retention and deletion process, emergency and interruption procedure.

## Next implementation milestones

1. Run migration in isolated local Supabase; verify RLS with two clients and practitioner. Add transaction-safe booking RPC with row lock, price lookup, active service checks, current consent version and intake prerequisites. Hold expiry and overlap exclusion must cover multiple slots and practitioner schedules, not just identical slot IDs.
2. Add a protected database access layer for private/clinical schemas (dedicated least-privilege database role). Check active staff membership on every staff request. Do not expose these schemas to make PostgREST convenient. Implement MFA gate for practitioners, session revocation checks, audit every clinical read/write without recording clinical content in logs.
3. Implement client intake, append-only versioned consent with approved document hash, check-ins, messaging with active care-relationship checks, signed resource URLs, account export/deletion request workflow. Add per-user throttling and staff notification handling.
4. Implement practitioner calendar, client view, availability management, intake status, resource assignment, content authoring, payments and audit dashboard. Replace editorial preview cards with published articles from the database.
5. Select payment provider. Create checkout server-side using stored fees and currency, verify raw webhook signature, deduplicate events, check expected amount/currency/reference and atomically confirm the held appointment. Handle expiry, failed payments, refunds and cancellation/rescheduling policies.
6. Select video provider after reviewing contractual/data-handling requirements. Create private expiring rooms, short-lived participant tokens and audio-only entry. Check appointment ownership, status and join window. No default recording. Implement device test and interruption recovery.
7. Implement transactional email outbox with scheduled reminder worker, retries and idempotency. Include only neutral appointment details; never clinical data. Browser timezones must be converted correctly for local date queries.
8. Run end-to-end tests on mobile/desktop, keyboard and screen reader; two-account isolation; denied anonymous reads; staff role revocation; double booking; DST boundaries; webhook replay; provider failures; reminder deduplication; refund/cancel cutoffs; storage access denial; audit tampering. Backups must be restored in a drill.

## Known verification limits

Frontend TypeScript and production bundle can be verified locally. SQL and edge runtime require a local or connected Supabase environment and have not been certified for production. No legal or healthcare regulatory compliance claim is made by the source code or design.

## Photography

Decorative landscapes are remote Unsplash image URLs. They do not depict Hala. Self-host appropriately licensed final imagery before production to avoid third-party image requests in client areas. No images of a person are represented as the practitioner.
