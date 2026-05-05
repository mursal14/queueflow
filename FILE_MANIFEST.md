# QUEUEFLOW — COMPLETE FILE MANIFEST
# 42 source files + 8 config files = 50 total

## CONFIG FILES (root)
.env.example          — All environment variables template
.gitignore            — Git ignore rules
next.config.js        — Next.js configuration + CORS headers
package.json          — Dependencies (Next.js, Supabase, Stripe, Resend, etc.)
postcss.config.js     — PostCSS + Autoprefixer
supabase-schema.sql   — FULL database schema, RLS policies, triggers, realtime
tailwind.config.js    — Design tokens, animations, brand colors
tsconfig.json         — TypeScript configuration

## DOCUMENTATION
README.md             — 30-minute deployment guide + full feature overview
UPLOAD_GUIDE.md       — GitHub upload + Vercel deployment (no terminal needed)
FILE_MANIFEST.md      — This file

## SOURCE: MIDDLEWARE
src/middleware.ts     — Auth guard, route protection, session validation

## SOURCE: APP ROOT
src/app/layout.tsx    — Root HTML layout, font, Toaster notifications
src/app/globals.css   — Design system (components, animations, utilities)

## SOURCE: MARKETING (public, no login)
src/app/(marketing)/layout.tsx          — Clean layout wrapper
src/app/(marketing)/page.tsx            — ⭐ FULL landing page: hero, features,
                                           how-it-works, pricing tables, testimonials,
                                           CTA section, footer
src/app/(marketing)/privacy/page.tsx    — GDPR-ready privacy policy
src/app/(marketing)/terms/page.tsx      — Complete terms of service
src/app/(marketing)/docs/page.tsx       — In-app FAQ/documentation

## SOURCE: AUTH PAGES
src/app/(auth)/layout.tsx               — Auth page wrapper with logo
src/app/(auth)/signup/page.tsx          — Signup: plan pre-selection, Stripe redirect,
                                           org creation, onboarding redirect
src/app/(auth)/login/page.tsx           — Login with email/password
src/app/(auth)/reset/page.tsx           — Password reset email request
src/app/(auth)/update-password/page.tsx — Set new password (from email link)
src/app/(auth)/verify/page.tsx          — Email verification screen, resend link

## SOURCE: ONBOARDING
src/app/onboarding/page.tsx             — 3-step guided wizard: org setup →
                                           first queue → display screen

## SOURCE: APP (protected dashboard)
src/app/(app)/layout.tsx                — Sidebar nav, mobile menu, user profile,
                                           auth guard, sign out
src/app/(app)/dashboard/page.tsx        — Stats grid, active queues, trial banner,
                                           welcome message
src/app/(app)/queues/page.tsx           — Queue list: QR modal, copy link, toggle
                                           status, delete
src/app/(app)/queues/new/page.tsx       — Create queue form with limit enforcement
src/app/(app)/queues/[id]/page.tsx      — ⭐ Queue management: call next, serving,
                                           complete, no-show, realtime, voice + SMS
src/app/(app)/locations/page.tsx        — Multi-location management: create, edit,
                                           toggle active/inactive, timezone
src/app/(app)/team/page.tsx             — Invite team, manage roles (admin/staff/viewer),
                                           remove members
src/app/(app)/analytics/page.tsx        — Daily stats, recent activity table
src/app/(app)/display/page.tsx          — Create/manage TV display screens
src/app/(app)/display/[token]/page.tsx  — ⭐ TV dashboard: realtime updates, now-serving
                                           banner, natural voice announcements, clock
src/app/(app)/billing/page.tsx          — Plan comparison, Stripe checkout, billing portal,
                                           trial countdown
src/app/(app)/settings/page.tsx         — Profile + org name, brand color, timezone

## SOURCE: PUBLIC PAGES (no login)
src/app/join/[publicId]/page.tsx        — ⭐ Customer join page: form → ticket →
                                           realtime position tracking → called alert

## SOURCE: API ROUTES
src/app/api/auth/setup/route.ts         — Creates org record after Supabase signup
src/app/api/limits/route.ts             — Plan limit enforcement for queues/locations/team
src/app/api/stripe/checkout/route.ts    — Creates Stripe checkout session with 14-day trial
src/app/api/stripe/webhook/route.ts     — Handles all Stripe events (payment, subscription)
src/app/api/stripe/portal/route.ts      — Opens Stripe billing portal
src/app/api/team/invite/route.ts        — Sends team invitation email
src/app/api/sms/route.ts                — Twilio SMS: join confirmation + called alert
src/app/api/notifications/join/route.ts — Email on queue join
src/app/api/notifications/called/route.ts — Email when ticket is called

## SOURCE: LIBRARIES
src/lib/supabase.ts   — Supabase client (browser + server + admin)
src/lib/stripe.ts     — Stripe client + plan config + limits
src/lib/email.ts      — Resend email templates (welcome, invite, join, called)
src/lib/utils.ts      — cn(), slugify(), formatWaitTime(), PLAN_COLORS
src/lib/hooks.ts      — useProfile(), useOrg(), usePlanLimits()

## SOURCE: TYPES
src/types/index.ts    — TypeScript interfaces: Profile, Organization, Queue,
                         QueueEntry, TeamMember, DisplayScreen, Location

---
## FEATURE COVERAGE MATRIX

| Requirement                    | File(s)                                              |
|-------------------------------|------------------------------------------------------|
| Real Stripe payments           | checkout/route.ts, webhook/route.ts, billing/page.tsx|
| Email verification             | signup/page.tsx → verify/page.tsx                    |
| Password reset flow            | reset/page.tsx → update-password/page.tsx            |
| Subscription limit enforcement | limits/route.ts + queues/new/page.tsx                |
| Team management                | team/page.tsx + invite/route.ts                      |
| Organisation branding          | settings/page.tsx + organizations table              |
| Public URLs per location       | join/[publicId]/page.tsx + queues table              |
| QR code generation             | queues/page.tsx + queues/[id]/page.tsx               |
| Enhanced audio system          | display/[token]/page.tsx (SpeechSynthesis)           |
| Real-time WebSocket updates    | queues/[id]/page.tsx + join/[publicId]/page.tsx      |
| SMS notifications              | sms/route.ts (Twilio)                                |
| Email notifications            | notifications/* routes (Resend)                      |
| Analytics dashboard            | analytics/page.tsx                                   |
| Billing portal                 | portal/route.ts + billing/page.tsx                   |
| Locations management           | locations/page.tsx                                   |
| Onboarding flow                | onboarding/page.tsx                                  |
| Privacy + Terms + GDPR         | privacy/page.tsx + terms/page.tsx                    |
| Documentation                  | docs/page.tsx + README.md + UPLOAD_GUIDE.md          |
