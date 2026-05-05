# QueueFlow — Complete Production SaaS

## ✅ FULLY FUNCTIONAL — What's included

| Feature | Status |
|---|---|
| Premium landing page + pricing | ✅ |
| User signup / login / password reset | ✅ |
| Email verification | ✅ |
| Stripe checkout (real payments) | ✅ |
| Subscription tiers (Free/Starter/Pro/Enterprise) | ✅ |
| 14-day free trial | ✅ |
| Customer billing portal | ✅ |
| Subscription limits enforcement | ✅ |
| Organisation + branding settings | ✅ |
| Team invite + role management | ✅ |
| Create / manage queues | ✅ |
| Public join page (no login needed) | ✅ |
| QR code generation | ✅ |
| Real-time queue updates (WebSocket) | ✅ |
| Call next / complete / no-show | ✅ |
| Natural audio announcements (TV display) | ✅ |
| TV display dashboard | ✅ |
| Analytics dashboard | ✅ |
| Email notifications on join + call | ✅ |
| Privacy policy + Terms of Service | ✅ |
| GDPR-ready | ✅ |

---

## 🚀 DEPLOY IN 30 MINUTES

### What you need (all free to start)

1. **GitHub account** — github.com
2. **Vercel account** — vercel.com (free)
3. **Supabase account** — supabase.com (free)
4. **Stripe account** — stripe.com (free, 2.9%+30¢/transaction)
5. **Resend account** — resend.com (free, 3,000 emails/month) — optional but recommended

---

## STEP 1 — Supabase (10 min)

1. Go to **supabase.com** → New project
2. Name: `queueflow`, choose region, set a strong password
3. Wait ~2 minutes for provisioning
4. Go to **SQL Editor** → New Query
5. Open `supabase-schema.sql` from this package, copy all, paste, click **Run**
6. Go to **Settings → API**, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key

---

## STEP 2 — Stripe (10 min)

1. Go to **stripe.com** → Create account
2. Stay in **Test mode** (toggle top-right)
3. Go to **Developers → API keys**, copy:
   - `Publishable key` (pk_test_...)
   - `Secret key` (sk_test_...)
4. Go to **Products** → Add product:
   - **Starter**: $29/month recurring → copy Price ID
   - **Professional**: $79/month recurring → copy Price ID
   - **Enterprise**: $199/month recurring → copy Price ID
5. Go to **Webhooks** → Add endpoint:
   - URL: `https://YOUR-SITE.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
   - Copy `Signing secret` (whsec_...)

---

## STEP 3 — Resend for email (2 min, optional)

1. Go to **resend.com** → Sign up
2. Verify your domain or use the sandbox
3. Create API key → copy it

---

## STEP 4 — Deploy to Vercel (10 min)

1. Upload this folder to a GitHub repo (see UPLOAD_GUIDE.md)
2. Go to **vercel.com** → New Project → Import repo
3. Add **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbG...
SUPABASE_SERVICE_ROLE_KEY       = eyJhbG...

STRIPE_SECRET_KEY               = sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_WEBHOOK_SECRET           = whsec_...
STRIPE_PRICE_STARTER            = price_...
STRIPE_PRICE_PROFESSIONAL       = price_...
STRIPE_PRICE_ENTERPRISE         = price_...

RESEND_API_KEY                  = re_...
EMAIL_FROM                      = noreply@yourdomain.com

NEXT_PUBLIC_APP_URL             = https://YOUR-SITE.vercel.app
```

4. Click **Deploy** — takes ~2 minutes
5. Copy your live URL and update `NEXT_PUBLIC_APP_URL`
6. Update Stripe webhook URL to your real URL

---

## STEP 5 — Test the complete flow

### Test Signup + Stripe
1. Go to `https://your-site.vercel.app`
2. Click **"Start 14-Day Trial"** on the Starter plan
3. Fill in the signup form
4. You'll be **redirected to Stripe Checkout**
5. Enter test card: `4242 4242 4242 4242`, any future date, any CVC
6. Submit → redirected back to `/dashboard`
7. Check Supabase `profiles` table — plan should be `starter`

### Test Queue Creation
1. In dashboard → click **Queues → New Queue**
2. Fill form → Create
3. Copy the **public join URL**

### Test Customer Join (Public)
1. Open new incognito window
2. Paste the public join URL
3. Fill in name → Join
4. You'll get a ticket number and real-time position

### Test Call Next
1. Back in dashboard → Queues → [your queue]
2. See the waiting customer
3. Click **Call Next**
4. Customer page updates automatically (real-time!)

### Test TV Display
1. Dashboard → Display Screens → Create screen
2. Click **Open Display**
3. Boom — full-screen TV dashboard with audio

---

## 💳 GO LIVE (Switch to Real Payments)

1. In Stripe Dashboard, toggle **Test → Live mode**
2. Create the same 3 products in Live mode
3. Get Live API keys
4. Update Vercel environment variables:
   - `STRIPE_SECRET_KEY` → live key (`sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → live key (`pk_live_...`)
   - `STRIPE_PRICE_*` → live price IDs
5. Create new Live webhook with same events
6. Redeploy

---

## 🌐 Custom Domain

1. Vercel → Your project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your domain
5. Update Stripe webhook URL

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (marketing)/           ← Public pages (landing, pricing, legal)
│   │   ├── page.tsx           ← Landing page with pricing
│   │   ├── privacy/           ← Privacy policy
│   │   └── terms/             ← Terms of service
│   ├── (auth)/                ← Auth pages
│   │   ├── signup/            ← Signup (with plan pre-selection)
│   │   ├── login/             ← Login
│   │   └── reset/             ← Password reset
│   ├── (app)/                 ← Protected dashboard (requires login)
│   │   ├── dashboard/         ← Main dashboard
│   │   ├── queues/            ← Queue management
│   │   ├── team/              ← Team management
│   │   ├── billing/           ← Subscription + Stripe
│   │   ├── settings/          ← Account settings
│   │   ├── analytics/         ← Analytics
│   │   └── display/           ← TV display screens
│   ├── join/[publicId]/       ← Public customer join page
│   └── api/
│       ├── auth/setup/        ← Create org after signup
│       ├── stripe/checkout/   ← Create Stripe checkout session
│       ├── stripe/webhook/    ← Handle Stripe events
│       ├── stripe/portal/     ← Customer billing portal
│       ├── team/invite/       ← Send team invites
│       └── notifications/join/ ← Email on queue join
├── lib/
│   ├── supabase.ts            ← Database client
│   ├── stripe.ts              ← Stripe + plan config
│   ├── email.ts               ← Resend email helpers
│   └── utils.ts               ← Shared utilities
└── types/index.ts             ← TypeScript types
```

---

## 💰 Revenue Model

| Plan | Price | Limits |
|---|---|---|
| Free | $0 | 2 queues, 1 location, 2 staff |
| Starter | $29/mo | 10 queues, 3 locations, 5 staff |
| Professional | $79/mo | 50 queues, 10 locations, 25 staff |
| Enterprise | $199/mo | Unlimited everything |

**Example Year 1 (conservative):**
- 30 Starter × $29 = $870/mo
- 10 Professional × $79 = $790/mo
- 2 Enterprise × $199 = $398/mo
- **Total MRR: $2,058 · ARR: ~$24,700**

---

## 🆘 Troubleshooting

**404 on Vercel?**  
Make sure Root Directory is set to the folder containing `package.json`.

**Login redirects to login again?**  
Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly.

**Stripe payment fails?**  
Use test card `4242 4242 4242 4242`. Check webhook secret matches.

**Real-time not working?**  
Check Supabase Realtime is enabled for the tables (the SQL schema enables it).

**Email not sending?**  
`RESEND_API_KEY` and `EMAIL_FROM` are optional — the system still works without them, just without email notifications.

---

## 🔒 Security

- All API routes verify JWT tokens
- Supabase Row-Level Security on all tables
- Passwords hashed by Supabase Auth
- Payments handled exclusively by Stripe (PCI-DSS)
- HTTPS enforced by Vercel
- Environment variables never exposed to client (except NEXT_PUBLIC_ ones)
