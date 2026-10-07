# Hala Psychology / Psychositive

A React + TypeScript + Vite + Tailwind application for an independent psychology practice.

## Run locally

```sh
npm ci
cp .env.example .env
npm run dev
npm run build
```

The public preview works without credentials. Authentication requires the Supabase URL and publishable key. Sessions are memory-only by default. No service-role key belongs in any `VITE_` variable.

## Current delivery

- Responsive ivory/sage public website, service pages, editorial previews, FAQ and pre-launch legal pages.
- Booking interface with service selection, video/audio preference, date selection and account flow. Availability/payment are intentionally closed pending configuration.
- Supabase sign-in/sign-up, protected client portal, appointment read view and server-authorized session entry boundary.
- Dashboard navigation shell. Staff access is deliberately denied until the server-side staff lookup is implemented and verified.
- Database migration draft separating clinical records and internal operations, strict grants/RLS, immutable client consent access, private resource bucket and appointment uniqueness.
- Provider contracts for payments, video and transactional email.

**This is a development foundation, not a live clinical service.** Messaging, intake submission, questionnaires, admin CRUD, payments, booking confirmation, reminders, cancellation/rescheduling and video provider adapters still need implementation and integration tests. There are no invented qualifications, fake bookings, or live payment forms.

## Backend setup

Use a new dedicated Supabase project; do not run this initial migration against an unrelated existing application. Review the migration, run it in local Supabase, and execute authorization tests before deploying. Keep `clinical` and `private` schemas out of exposed API schemas. Only `public` is intended for client access. Deploy `practice-api` with JWT verification enabled and set `APP_ORIGIN` to the exact frontend origin.

See [launch plan](docs/LAUNCH.md) for remaining work and acceptance criteria.

## Hosting

`npm run build` outputs `dist/`. SPA fallback and security headers are included for compatible hosts. Configure equivalent rules on other hosts. Update CSP only for chosen video/payment providers. No production deployment is included in this commit.
