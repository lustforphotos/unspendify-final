# Quick Launch Checklist

**Goal**: Get a working app in ~35 minutes

**What you'll have**: Users can sign up, connect Gmail, see subscriptions, and upgrade (test mode)

---

## ☐ Step 1: Google OAuth (20 min)

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable **Gmail API**:
   - Navigation menu → APIs & Services → Library
   - Search "Gmail API" → Enable

### 1.2 Create OAuth Credentials
1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Configure consent screen first if prompted:
   - User Type: **External**
   - App name: Your app name
   - User support email: Your email
   - Scopes: Add `gmail.readonly`
   - Test users: Add your email
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/functions/v1/oauth-callback
   ```
5. Copy **Client ID** and **Client Secret**

### 1.3 Add to Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your project → Settings → Edge Functions → Secrets
3. Add secrets:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

### 1.4 Test OAuth Flow
1. Deploy the app (see Step 4)
2. Sign up with test account
3. Click "Connect Gmail" on dashboard
4. Authorize access
5. Should redirect back successfully

---

## ☐ Step 2: Stripe Test Mode (15 min)

### 2.1 Get Test API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle to **Test mode** (top right switch)
3. Developers → API keys
4. Copy **Secret key** (starts with `sk_test_`)

### 2.2 Create Webhook
1. Developers → Webhooks → Add endpoint
2. Endpoint URL:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/functions/v1/stripe-webhooks
   ```
3. Listen to events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing secret** (starts with `whsec_`)

### 2.3 Add to Supabase
Add these secrets in Edge Functions settings:
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 2.4 Create Products (Optional)
The app can work with existing test products, but if you want:
1. Products → Create product
2. Name: "Pro Monthly" or "Business Monthly"
3. Set price
4. Copy Price ID for frontend if needed

### 2.5 Test Checkout
1. In your deployed app, click "Upgrade"
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date, any CVC
4. Should complete successfully

---

## ☐ Step 3: Supabase Cron Jobs (5 min)

### 3.1 Enable pg_cron Extension
1. Supabase Dashboard → Database → Extensions
2. Search "pg_cron" → Enable

### 3.2 Set Up Jobs
Run this SQL in the SQL Editor:

```sql
-- Scan emails every 15 minutes
SELECT cron.schedule(
  'scan-emails-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/scan-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Detect tools daily at 2 AM
SELECT cron.schedule(
  'detect-tools-job',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/detect-tools',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule notifications daily at 9 AM
SELECT cron.schedule(
  'schedule-notifications-job',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/schedule-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Send notifications every 5 minutes
SELECT cron.schedule(
  'send-notifications-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 3.3 Verify Jobs
```sql
SELECT * FROM cron.job;
```
Should see 4 jobs listed.

---

## ☐ Step 4: Deploy Frontend (5 min)

### Option A: Netlify (Easiest)
1. Run build locally:
   ```bash
   npm run build
   ```
2. Go to [Netlify](https://app.netlify.com/)
3. Drag & drop the `dist` folder
4. Done! Get your URL

### Option B: Vercel
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel --prod
   ```
3. Follow prompts

### Update OAuth Redirect
After deployment, update Google OAuth redirect URI with your production URL:
```
https://your-app.netlify.app (or your custom domain)
```

---

## ☐ Step 5: Test Everything (5 min)

### 5.1 Create Test Account
1. Go to your deployed app
2. Sign up with email
3. Verify you can log in

### 5.2 Connect Gmail
1. Click "Connect Gmail"
2. Authorize access
3. Should see "Connected" status

### 5.3 Wait for Scan (or trigger manually)
Wait 15 minutes for automatic scan, or trigger manually:
```bash
curl -X POST \
  https://[YOUR-PROJECT-REF].supabase.co/functions/v1/scan-emails \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

### 5.4 Test Upgrade
1. Click "Upgrade to Pro"
2. Use test card: `4242 4242 4242 4242`
3. Complete checkout
4. Verify plan shows as "Pro" in dashboard

---

## Troubleshooting

### OAuth Not Working
- Check redirect URI exactly matches (trailing slash matters)
- Verify secrets are set in Supabase
- Check browser console for errors

### Stripe Not Working
- Ensure Test Mode is enabled
- Verify webhook secret is correct
- Check Edge Function logs in Supabase

### Emails Not Scanning
- Verify cron jobs are scheduled: `SELECT * FROM cron.job;`
- Check Edge Function logs
- Manually trigger scan to test

### Build Fails
```bash
npm run typecheck
```
Fix any TypeScript errors first.

---

## What's NOT Included (Add Later)

- ❌ Microsoft OAuth (Outlook support)
- ❌ Resend (email notifications)
- ❌ Stripe live mode (real payments)
- ❌ Custom domain
- ❌ Analytics tracking

These can all be added incrementally without breaking existing functionality.

---

## Launch Checklist Summary

- [ ] Google OAuth configured
- [ ] Stripe test mode configured
- [ ] 4 cron jobs scheduled
- [ ] Frontend deployed
- [ ] Test account created
- [ ] Gmail connected successfully
- [ ] Email scan working
- [ ] Test upgrade completed

**Total time**: ~35 minutes

**You now have**: A fully functional SaaS app that detects subscriptions from Gmail and handles upgrades!

---

## Next Steps After Launch

1. **Monitor**: Watch Supabase logs for errors
2. **Iterate**: Add Microsoft OAuth if users request
3. **Go Live**: Switch Stripe to live mode when ready
4. **Market**: Start getting real users
5. **Scale**: Add features based on feedback

Need help with any step? Check SETUP_GUIDE.md for detailed explanations.
