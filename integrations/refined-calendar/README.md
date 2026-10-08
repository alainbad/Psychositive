# Refined design: connected reservation calendar

This overlay targets Lovable project 8edd479c-f55f-4cb1-8a00-3b5e15175876 at bcd4a790961e5f703bed6e1525135117c21d7d3d. It is kept separate from the older Vite design at the repository root so the user's current visual design is preserved.

## Installed backend
The dedicated Supabase project ufmrvvpjlppaoksucmfn has migration 20261008053926 and Edge Function `reservations` installed. It stores scheduling only, with service-only mutations, per-client read access, idempotency, fixed 30/45-minute durations, overlap exclusion, cancellation and audit. Public availability exposes only start/end times. No privileged credentials are included in frontend code.

## Apply without Lovable build credits
1. Connect the current Lovable project to GitHub using project Settings > GitHub. Lovable exports its latest design and images to a connected repository; do not overwrite it with the old root Vite app.
2. Copy the files in this directory into matching paths in that exported project, including package.json and package-lock.json. The original generated image files remain unchanged. Commit to the connected branch.
3. Use Lovable only to publish after verifying the synced build.

## Availability and administration
No availability has been invented or seeded. Create and verify Hala's practice account, then explicitly grant that account a row in scheduling_private.admins through a trusted database administrator. The practice calendar appears inside the client portal for authorised staff. Hala can add and remove date/time windows and confirm, cancel or complete reservation requests. Regular clients cannot call administrative operations.

Configure Supabase Auth's site URL and allowed redirects to the final published URL before creating accounts. Email verification is required for private API actions. The interface deliberately uses an in-memory auth session; a refresh requires signing in again.

The current database defaults are 2 hours' lead time, a 90-day booking horizon, and a 24-hour online cancellation cutoff. These are configurable in scheduling_private.settings and require the practice's review before clinical launch. Scheduling consent is versioned separately from clinical telehealth consent. Fees, payments, clinical intake, video/audio session access and reminder delivery are not connected by this change.

## Validation
TypeScript passed for the refined project. Eighteen local unit checks passed, including display-date grouping and session range formatting; timezone checks also passed under Asia/Dubai. Database rollback tests passed for duration, window fit, overlap rejection, replay/idempotency, format restrictions, client ownership/RLS, RPC permissions, cancellation and audit. Live Edge HTTP checks returned empty actual availability and rejected unauthenticated reservation/admin access. Test users and slots were rolled back, leaving no real reservations.

A production frontend build and visual browser checks remain dependent on exporting the actual project and its binary images; those checks have not been claimed here.
