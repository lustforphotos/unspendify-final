# Beta Launch Checklist

**Status:** Almost Ready - 5-10 minutes remaining

---

## ✅ COMPLETE

### Database
- [x] 12 migrations applied
- [x] 17 tables with RLS enabled
- [x] All indexes and constraints set up
- [x] email_connections table ready for OAuth
- [x] billing_subscriptions table ready for Stripe

### Edge Functions
- [x] 13 functions deployed and active:
  - oauth-initiate
  - oauth-callback
  - scan-emails
  - detect-tools
  - process-emails
  - schedule-notifications
  - send-notifications
  - stripe-checkout
  - stripe-webhooks
  - stripe-portal
  - health-check
  - inbound-email
  - ingest-email

### Frontend
- [x] Build successful (448 KB)
- [x] Environment variables configured (.env)
- [x] All pages created
- [x] Authentication flow implemented

---

## 🔧 VERIFY THESE (2 minutes)

### Supabase Secrets Check

Go to: **Supabase Dashboard → Settings → Edge Functions → Secrets**

Verify these secrets exist:

**OAuth (Required for Gmail/Outlook):**
- [ ] `GOOGLE_CLIENT_ID` - Set?
- [ ] `GOOGLE_CLIENT_SECRET` - Set?
- [ ] `MICROSOFT_CLIENT_ID` - Set?
- [ ] `MICROSOFT_CLIENT_SECRET` - Set?

**Stripe (Required for billing):**
- [ ] `STRIPE_SECRET_KEY` - Set?
- [ ] `STRIPE_WEBHOOK_SECRET` - Set?

If any are missing, see setup instructions below.

---

## 🚀 DEPLOY NOW (5-10 minutes)

### Step 1: Add Cron Jobs (3 minutes)

**Action:** Run `setup-cron-jobs.sql` in Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy contents from `setup-cron-jobs.sql`
3. Execute the SQL
4. Verify 5 jobs are scheduled:
   - daily-email-scan (2 AM)
   - scan-emails-periodic (every 15 min)
   - detect-tools-daily (3 AM)
   - schedule-notifications-daily (9 AM)
   - send-notifications-periodic (every 5 min)

### Step 2: Deploy Frontend (5 minutes)

**Option A: Netlify (Recommended)**

```bash
npm run build
```

Then drag/drop `dist/` folder to Netlify.

**Option B: Vercel**

```bash
npm install -g vercel
vercel --prod
```

**Environment Variables:**
Your hosting platform will automatically use the `.env` file values.

### Step 3: Test OAuth (2 minutes)

1. Sign up with test email
2. Click "Connect Gmail"
3. Should redirect to Google OAuth
4. Authorize and redirect back
5. Should see "Connected" status

### Step 4: Test End-to-End (Optional)

**Manual test:**
1. After connecting Gmail, wait 15 minutes for automatic scan
2. Or trigger manually:
   ```bash
   curl -X POST \
     https://wqbkgvmnebhayzlsupoj.supabase.co/functions/v1/scan-emails \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```
3. Check dashboard for detected tools

---

## 📋 IF SECRETS ARE MISSING

### Google OAuth Setup (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Gmail API
3. OAuth consent screen → External → Add scopes: `gmail.readonly`
4. Credentials → Create OAuth Client ID → Web application
5. Authorized redirect URI:
   ```
   https://wqbkgvmnebhayzlsupoj.supabase.co/functions/v1/oauth-callback
   ```
6. Copy Client ID and Secret
7. Add to Supabase secrets:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Microsoft OAuth Setup (5 minutes)

1. Go to [Azure Portal](https://portal.azure.com/)
2. App registrations → New registration
3. Redirect URI (Web):
   ```
   https://wqbkgvmnebhayzlsupoj.supabase.co/functions/v1/oauth-callback
   ```
4. API permissions → Add: `Mail.Read` + `offline_access`
5. Certificates & secrets → New client secret
6. Copy Application ID and Secret
7. Add to Supabase secrets:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`

### Stripe Setup (5 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle Test Mode** (top right)
3. Developers → API keys → Copy Secret key
4. Developers → Webhooks → Add endpoint:
   ```
   https://wqbkgvmnebhayzlsupoj.supabase.co/functions/v1/stripe-webhooks
   ```
5. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Copy webhook signing secret
7. Add to Supabase secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

---

## 🎯 Beta Ready Criteria

- [x] Database migrations applied
- [x] Edge functions deployed
- [x] Frontend builds successfully
- [ ] Cron jobs scheduled (run setup-cron-jobs.sql)
- [ ] OAuth secrets verified
- [ ] Stripe secrets verified
- [ ] Frontend deployed to hosting
- [ ] Test user can sign up
- [ ] Test user can connect Gmail
- [ ] Tools detected after scan

---

## ⏱️ Time Estimate

- **If secrets are configured:** 5-10 minutes
  - Cron jobs: 3 min
  - Deploy frontend: 5 min
  - Test: 2 min

- **If secrets need setup:** 30-40 minutes
  - Google OAuth: 10 min
  - Microsoft OAuth: 10 min
  - Stripe: 10 min
  - Cron jobs: 3 min
  - Deploy: 5 min
  - Test: 2 min

---

## 🔗 Quick Links

- Supabase Dashboard: https://supabase.com/dashboard/project/wqbkgvmnebhayzlsupoj
- Edge Functions: https://supabase.com/dashboard/project/wqbkgvmnebhayzlsupoj/functions
- SQL Editor: https://supabase.com/dashboard/project/wqbkgvmnebhayzlsupoj/sql
- Secrets: https://supabase.com/dashboard/project/wqbkgvmnebhayzlsupoj/settings/functions

---

## 🚨 Common Issues

**OAuth redirect fails:**
- Check redirect URI matches exactly (no trailing slash)
- Verify secrets are set in Supabase
- Check browser console for errors

**Stripe checkout fails:**
- Ensure Test Mode is enabled
- Verify webhook URL is correct
- Check Edge Function logs

**No emails detected:**
- Wait 15 minutes for automatic scan
- Or trigger manually with curl command above
- Check email_connections table has active connection

---

## 📞 Support

If stuck:
1. Check Supabase Edge Function logs
2. Review browser console errors
3. Verify all secrets are set correctly
4. Check cron jobs are scheduled: `SELECT * FROM cron.job;`
