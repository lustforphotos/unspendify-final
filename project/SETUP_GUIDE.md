# Unspendify Setup Guide

This guide walks you through the essential configuration needed before launch.

## Required Setup (30-45 minutes)

### Step 1: Google OAuth (15 minutes)

**Why needed**: Users connect their Gmail to scan for subscriptions

1. Go to https://console.cloud.google.com
2. Create a new project called "Unspendify"
3. Enable Google Gmail API:
   - Click "Enable APIs and Services"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "Credentials" tab
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Unspendify Production"
   - Authorized redirect URIs: `https://[your-project-id].supabase.co/functions/v1/oauth-callback`
   - Click "Create"
5. **Copy these values** (you'll need them):
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret

### Step 2: Microsoft OAuth (15 minutes)

**Why needed**: Users connect their Outlook to scan for subscriptions

1. Go to https://portal.azure.com
2. Search for "App registrations" → Click "New registration"
3. Name: "Unspendify"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI:
   - Platform: Web
   - URL: `https://[your-project-id].supabase.co/functions/v1/oauth-callback`
6. Click "Register"
7. **Copy the Application (client) ID**
8. Go to "Certificates & secrets" → "New client secret"
   - Description: "Production"
   - Expires: 24 months
   - Click "Add"
9. **Copy the secret Value** (shows only once!)
10. Go to "API permissions" → "Add a permission"
    - Microsoft Graph → Delegated permissions
    - Add: `Mail.Read`, `offline_access`, `User.Read`
    - Click "Add permissions"

### Step 3: Stripe Setup (10 minutes)

**Why needed**: Handle payments and subscriptions

1. Go to https://stripe.com and create an account
2. Complete business verification (can take 1-2 days)
3. Get API keys:
   - Go to Developers → API keys
   - **Copy the Secret key** (starts with `sk_live_` or `sk_test_`)
4. Set up webhook:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://[your-project-id].supabase.co/functions/v1/stripe-webhooks`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - **Copy the Signing secret** (starts with `whsec_`)
5. Enable Customer Portal:
   - Go to Settings → Billing → Customer Portal
   - Click "Activate"
   - Allow: Cancel subscriptions, Update payment methods

### Step 4: Resend (Optional, 5 minutes)

**Why needed**: Send email notifications to users

1. Go to https://resend.com and sign up
2. Get API key:
   - Go to API Keys
   - Click "Create API Key"
   - Name: "Unspendify Production"
   - Permission: "Full access"
   - **Copy the API key** (starts with `re_`)
3. (Optional) Add your domain:
   - Go to Domains → Add Domain
   - Follow DNS verification steps

## Configure Supabase Secrets

Once you have all the keys above, configure them in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to: Project Settings → Edge Functions → Secrets
3. Add these secrets:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
STRIPE_SECRET_KEY=sk_live_or_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
RESEND_API_KEY=re_xxxxx
APP_URL=https://yourdomain.com
```

## Configure Cron Jobs

In Supabase Dashboard → Edge Functions → Cron:

Add these 4 schedules:

| Function | Schedule | Expression | Description |
|----------|----------|------------|-------------|
| scan-emails | Every 15 minutes | `*/15 * * * *` | Scan connected inboxes |
| detect-tools | Every 30 minutes | `*/30 * * * *` | Detect new tools |
| schedule-notifications | Daily at 8am | `0 8 * * *` | Schedule alerts |
| send-notifications | Every 15 minutes | `*/15 * * * *` | Send pending alerts |

## Deploy Frontend

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider:
   - **Netlify**: Drag and drop `dist/` folder
   - **Vercel**: Import from Git or upload `dist/`
   - **Cloudflare Pages**: Connect Git repo or upload

3. Set environment variables in your hosting provider:
   ```
   VITE_SUPABASE_URL=https://[your-project].supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Configure custom domain (optional)

## Testing Checklist

After configuration, test these flows:

- [ ] Sign up for new account
- [ ] Connect Gmail inbox (OAuth flow works)
- [ ] Connect Outlook inbox (OAuth flow works)
- [ ] Wait 15 minutes and check if tools are detected
- [ ] View detected tools in dashboard
- [ ] Upgrade to Starter plan (Stripe checkout works)
- [ ] Manage billing (Stripe portal works)
- [ ] Test tool classification features

## Common Issues

### "OAuth redirect mismatch"
- Make sure redirect URI exactly matches in Google/Microsoft console
- Format: `https://[project-id].supabase.co/functions/v1/oauth-callback`

### "Stripe webhook failed"
- Check webhook signing secret is correct
- Verify webhook URL is correct
- Check edge function logs for errors

### "No tools detected"
- Check scan-emails cron job is running
- Verify OAuth tokens are valid
- Check edge function logs for errors

## Quick Links

- Supabase Dashboard: https://supabase.com/dashboard
- Google Cloud Console: https://console.cloud.google.com
- Azure Portal: https://portal.azure.com
- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com/emails

## Support

If you get stuck, check:
1. Supabase Edge Function logs
2. Browser console for frontend errors
3. Stripe webhook logs
4. This project's documentation in `/docs`

---

**Once all steps are complete, your application will be fully operational and ready for users!**
