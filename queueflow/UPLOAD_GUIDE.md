# UPLOAD TO GITHUB & DEPLOY TO VERCEL

## Option 1: GitHub Website (Easiest — no terminal needed)

### Step 1: Create GitHub Repository
1. Go to github.com and sign in
2. Click **"+"** (top right) → **New repository**
3. Name: `queueflow`
4. Keep it Private or Public (your choice)
5. **Do NOT check** "Add README" or any other options
6. Click **Create repository**

### Step 2: Upload Files
1. On the empty repo page, click **"uploading an existing file"**
2. Open the **queueflow** folder on your computer
3. Select **all files and folders inside it** (Ctrl+A / Cmd+A)
4. Drag them into the GitHub upload area
5. GitHub will show "X files selected"
6. Scroll down, click **"Commit changes"**

> ⚠️ If GitHub can't handle nested folders via drag-and-drop (it usually can for ~50 files), use Option 2.

---

## Option 2: GitHub Desktop (Recommended for large projects)

1. Download **GitHub Desktop** from desktop.github.com
2. Sign in with your GitHub account
3. File → **Add Local Repository** → browse to the `queueflow` folder
4. If it says "not a repository", click **"create a repository"**
   - Name: `queueflow`
   - Keep all defaults
5. Click **"Publish repository"**
6. Choose public or private → **Publish**

---

## Option 3: Terminal (For developers)

```bash
cd path/to/queueflow
git init
git add .
git commit -m "Initial QueueFlow commit"
git remote add origin https://github.com/YOUR_USERNAME/queueflow.git
git push -u origin main
```

---

## Deploy to Vercel

### Step 1: Connect GitHub
1. Go to **vercel.com** → Sign up/in with GitHub
2. Click **"New Project"**
3. Find your `queueflow` repo → Click **"Import"**

### Step 2: Configure Build
- Framework Preset: **Next.js** (auto-detected)
- Root Directory: `./` (leave default)
- Build Command: `next build` (auto)
- Output Directory: `.next` (auto)

### Step 3: Add Environment Variables
Click **"Environment Variables"** and add each:

| Name | Value |
|------|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbG... |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbG... |
| STRIPE_SECRET_KEY | sk_test_... |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_test_... |
| STRIPE_WEBHOOK_SECRET | whsec_... |
| STRIPE_PRICE_STARTER | price_... |
| STRIPE_PRICE_PROFESSIONAL | price_... |
| STRIPE_PRICE_ENTERPRISE | price_... |
| RESEND_API_KEY | re_... (optional) |
| EMAIL_FROM | noreply@yourdomain.com (optional) |
| NEXT_PUBLIC_APP_URL | https://YOUR-SITE.vercel.app |

### Step 4: Deploy
Click **"Deploy"**. Wait ~2 minutes.

### Step 5: Update App URL
1. Copy your live Vercel URL (e.g. `https://queueflow-abc123.vercel.app`)
2. Go to Vercel → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` to your live URL
4. Redeploy: Deployments → "..." → Redeploy

### Step 6: Update Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click your webhook endpoint
3. Update the URL to: `https://YOUR-SITE.vercel.app/api/stripe/webhook`

---

## Custom Domain (Optional)

1. Vercel project → **Settings** → **Domains**
2. Type your domain → **Add**
3. Follow DNS instructions (usually add a CNAME record)
4. Wait for SSL (usually 5 min)
5. Update `NEXT_PUBLIC_APP_URL` to your domain
6. Update Stripe webhook URL

---

## You're live! Test with:

1. Open your site URL
2. Click **"Start Free Trial"** on any plan
3. Create an account
4. Complete onboarding
5. Create a queue
6. Open the public join URL in incognito
7. Join the queue
8. Call next from dashboard
9. Watch the real-time update!
