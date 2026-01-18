# Edge Functions Reference

All Supabase Edge Functions for Unspendify platform.

## Deployed Functions

### 1. process-emails

**Purpose:** Parse raw emails into structured events

**Endpoint:** `POST /functions/v1/process-emails`

**Authentication:** None (internal cron)

**Trigger:** Cron every 5 minutes

**Functionality:**
- Fetches unprocessed emails from `raw_emails`
- Extracts vendor name, amount, billing cycle, event type
- Detects renewal dates from email content
- Calculates confidence score
- Inserts into `parsed_events` table

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)

**Cron Schedule:** `*/5 * * * *` (every 5 minutes)

**Parsing Logic:**
- Vendor: Extracted from sender email domain
- Amount: Pattern matching for currency amounts
- Billing Cycle: Keywords (monthly, yearly, annual)
- Event Type: Keywords (trial, renewal, cancellation, invoice)
- Renewal Date: Date pattern matching
- Confidence: Based on extracted fields (20-100 score)

---

### 2. detect-tools

**Purpose:** Create and update tools from parsed events

**Endpoint:** `POST /functions/v1/detect-tools`

**Authentication:** None (internal cron)

**Trigger:** Cron every 10 minutes

**Functionality:**
- Fetches high-confidence parsed events (score >= 50)
- Matches events to existing tools by vendor + organization
- Creates new tools for first-time detections
- Updates existing tools with latest event data
- Creates renewal records for detected renewal dates
- Updates tool status (active, trial, cancelled)

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)

**Cron Schedule:** `*/10 * * * *` (every 10 minutes)

**Tool Status Logic:**
- `trial` - Event type is trial_start
- `cancelled` - Event type is cancellation
- `active` - All other event types (renewals, invoices)

---

### 3. schedule-notifications

**Purpose:** Create notification records for upcoming events

**Endpoint:** `POST /functions/v1/schedule-notifications`

**Authentication:** None (internal cron)

**Trigger:** Cron daily at 8am UTC

**Functionality:**
- Finds renewals in next 30 days
- Creates notifications at 30d, 14d, 7d, 3d, 1d before renewal
- Identifies recipients (admins, tool owners, opted-in members)
- Checks for trial tools ending soon (3d, 1d before)
- Avoids duplicate notifications
- Respects user notification preferences

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)

**Cron Schedule:** `0 8 * * *` (daily at 8am UTC)

**Recipient Logic:**
- Admins: Always receive all alerts
- Tool Owners: Always receive alerts for their tools
- Members: Based on notification_preferences table

---

### 4. send-notifications

**Purpose:** Send pending notifications via email

**Endpoint:** `POST /functions/v1/send-notifications`

**Authentication:** None (internal cron)

**Trigger:** Cron every 15 minutes

**Functionality:**
- Fetches pending notifications where scheduled_for <= now
- Generates appropriate email content per notification type
- Sends email via Resend API
- Updates notification status (sent/failed)
- Includes renewal details and call-to-action links

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)
- `RESEND_API_KEY` (required)
- `APP_URL` (required)

**Cron Schedule:** `*/15 * * * *` (every 15 minutes)

**Email Templates:**
- **Renewal Alert:** Tool name, amount, renewal date, CTA button
- **Trial Alert:** Tool name, warning, days until conversion, CTA button

---

### 5. health-check

**Purpose:** System health monitoring

**Endpoint:** `GET /functions/v1/health-check`

**Authentication:** None (public monitoring)

**Trigger:** On-demand or monitoring service

**Functionality:**
- Checks database connectivity
- Verifies email service (Resend API)
- Returns overall system status
- Provides per-service status

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_ANON_KEY` (auto)
- `RESEND_API_KEY` (optional, for email check)

**Cron Schedule:** N/A (on-demand)

**Response Format:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": "ok|error",
    "email_service": "ok|error"
  },
  "version": "1.0.0"
}
```

**Status Codes:**
- 200: Healthy or degraded
- 503: Unhealthy (database failure)

---

### 6. oauth-initiate

**Purpose:** Initiate OAuth flow for Gmail/Outlook inbox connections

**Endpoint:** `POST /functions/v1/oauth-initiate`

**Authentication:** Required (Bearer token)

**Trigger:** User clicks "Connect Gmail" or "Connect Outlook"

**Functionality:**
- Validates user authentication
- Generates OAuth authorization URL
- Encodes state with provider, organization ID, and user ID
- Returns auth URL for popup window

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)
- `GOOGLE_CLIENT_ID` (required for Gmail)
- `MICROSOFT_CLIENT_ID` (required for Outlook)

**Request Body:**
```json
{
  "provider": "gmail|outlook",
  "organizationId": "uuid"
}
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

### 7. oauth-callback

**Purpose:** Handle OAuth callback and store access tokens

**Endpoint:** `GET /functions/v1/oauth-callback`

**Authentication:** None (receives OAuth code from provider)

**Trigger:** OAuth provider redirects after user authorization

**Functionality:**
- Exchanges authorization code for access tokens
- Fetches user's email address from provider
- Stores connection in `email_connections` table
- Stores encrypted tokens in `oauth_tokens` table
- Triggers initial email scan
- Closes popup window with success message

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)
- `GOOGLE_CLIENT_ID` (required for Gmail)
- `GOOGLE_CLIENT_SECRET` (required for Gmail)
- `MICROSOFT_CLIENT_ID` (required for Outlook)
- `MICROSOFT_CLIENT_SECRET` (required for Outlook)

---

### 8. scan-emails

**Purpose:** Scan Gmail/Outlook inbox for subscription emails

**Endpoint:** `POST /functions/v1/scan-emails`

**Authentication:** None (internal cron)

**Trigger:** Cron daily at 2am UTC

**Functionality:**
- Fetches active email connections
- Retrieves OAuth tokens
- Queries Gmail/Outlook API for invoice-related emails
- Filters by keywords (invoice, subscription, payment, renewal)
- Stores emails in `raw_emails` table
- Updates last_scan_at timestamp
- Performs initial backfill for new connections

**Environment Variables:**
- `SUPABASE_URL` (auto)
- `SUPABASE_SERVICE_ROLE_KEY` (auto)

**Cron Schedule:** `0 2 * * *` (daily at 2am UTC)

**Search Filters:**
- Gmail: `subject:(invoice OR subscription OR payment OR renewal)`
- Outlook: `$filter=contains(subject,'invoice') or contains(subject,'subscription')`

---

## OAuth Setup Guide

### Gmail/Google OAuth Setup

1. **Create OAuth Credentials in Google Cloud Console**

   a. Go to [Google Cloud Console](https://console.cloud.google.com)

   b. Create a new project or select existing project

   c. Enable Gmail API:
      - Go to "APIs & Services" → "Library"
      - Search for "Gmail API"
      - Click "Enable"

   d. Create OAuth consent screen:
      - Go to "APIs & Services" → "OAuth consent screen"
      - Select "External" (or "Internal" for Workspace)
      - Fill in app name, email, and developer contact
      - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
      - Save and continue

   e. Create OAuth Client ID:
      - Go to "APIs & Services" → "Credentials"
      - Click "Create Credentials" → "OAuth client ID"
      - Application type: "Web application"
      - Name: "Unspendify"
      - Add authorized redirect URI: `https://[your-project].supabase.co/functions/v1/oauth-callback`
      - Click "Create"
      - Copy Client ID and Client Secret

2. **Set Environment Variables in Supabase**

   Via Supabase Dashboard:
   - Go to Project Settings → Edge Functions → Secrets
   - Add `GOOGLE_CLIENT_ID` with your client ID
   - Add `GOOGLE_CLIENT_SECRET` with your client secret

   Via Supabase CLI:
   ```bash
   supabase secrets set GOOGLE_CLIENT_ID=your_client_id
   supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. **Redeploy oauth-initiate and oauth-callback functions**

   The functions need to be redeployed to pick up the new secrets.

---

### Outlook/Microsoft OAuth Setup

1. **Create OAuth App in Azure Portal**

   a. Go to [Azure Portal](https://portal.azure.com)

   b. Navigate to "Azure Active Directory" → "App registrations"

   c. Click "New registration":
      - Name: "Unspendify"
      - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
      - Redirect URI: Web → `https://[your-project].supabase.co/functions/v1/oauth-callback`
      - Click "Register"

   d. Note the "Application (client) ID" on the overview page

   e. Create a client secret:
      - Go to "Certificates & secrets"
      - Click "New client secret"
      - Description: "Unspendify production"
      - Expires: 24 months (or as needed)
      - Click "Add"
      - Copy the secret value (you won't see it again!)

   f. Set API permissions:
      - Go to "API permissions"
      - Click "Add a permission"
      - Select "Microsoft Graph"
      - Select "Delegated permissions"
      - Add: `Mail.Read` and `offline_access`
      - Click "Add permissions"
      - Click "Grant admin consent" (if you're admin)

2. **Set Environment Variables in Supabase**

   Via Supabase Dashboard:
   - Go to Project Settings → Edge Functions → Secrets
   - Add `MICROSOFT_CLIENT_ID` with your application ID
   - Add `MICROSOFT_CLIENT_SECRET` with your client secret

   Via Supabase CLI:
   ```bash
   supabase secrets set MICROSOFT_CLIENT_ID=your_client_id
   supabase secrets set MICROSOFT_CLIENT_SECRET=your_client_secret
   ```

3. **Redeploy oauth-initiate and oauth-callback functions**

---

### Testing OAuth Flow

1. **Check function is deployed:**
   ```bash
   curl https://[project].supabase.co/functions/v1/oauth-initiate \
     -H "Authorization: Bearer [your-token]" \
     -H "Content-Type: application/json" \
     -d '{"provider":"gmail","organizationId":"[org-id]"}'
   ```

2. **Expected response:**
   ```json
   {
     "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
   }
   ```

3. **Error responses:**
   - `Google OAuth not configured` → `GOOGLE_CLIENT_ID` not set
   - `Microsoft OAuth not configured` → `MICROSOFT_CLIENT_ID` not set
   - `Unauthorized` → Invalid or missing auth token
   - `Provider and organizationId required` → Missing request body

---

## Testing Functions Manually

### Test background workers

```bash
# Process emails
curl -X POST https://[project].supabase.co/functions/v1/process-emails

# Detect tools
curl -X POST https://[project].supabase.co/functions/v1/detect-tools

# Schedule notifications
curl -X POST https://[project].supabase.co/functions/v1/schedule-notifications

# Send notifications
curl -X POST https://[project].supabase.co/functions/v1/send-notifications
```

### Test health check

```bash
curl https://[project].supabase.co/functions/v1/health-check
```

---

## Monitoring

### Viewing Logs

Access logs in Supabase Dashboard:
1. Navigate to Edge Functions
2. Select function name
3. Click "Logs" tab
4. Filter by time range or search term

### Common Log Patterns

**Success:**
```
Email stored successfully: [subject]
Processed 5 emails, 0 failed
Created 3 tools, updated 2 tools
Sent 10 notifications, 0 failed
```

**Errors:**
```
Mailbox not found or inactive: [email]
Failed to insert email: [error]
Failed to fetch events: [error]
Resend API error: [details]
```

---

## Troubleshooting

### Function Not Executing

1. Check cron schedule configured
2. Verify function deployed successfully
3. Check for runtime errors in logs
4. Ensure required secrets are set

### High Error Rate

1. Review error logs for patterns
2. Check database connection limits
3. Verify API keys valid
4. Check for malformed data

### Slow Performance

1. Review function execution time
2. Check database query performance
3. Add indexes if needed
4. Reduce batch sizes if processing too much

### Email Delivery Failures

1. Verify RESEND_API_KEY is valid
2. Check Resend dashboard for bounces
3. Review send-notifications logs
4. Ensure from address verified in Resend

---

## Secrets Management

Set secrets via Supabase CLI or Dashboard:

```bash
# Via CLI (if available)
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set APP_URL=https://yourdomain.com
supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret
supabase secrets set MICROSOFT_CLIENT_ID=your_microsoft_client_id
supabase secrets set MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Via Dashboard
# Navigate to: Project Settings → Edge Functions → Secrets
```

**Required Secrets:**
- `RESEND_API_KEY` - For sending notification emails
- `APP_URL` - Frontend application URL
- `GOOGLE_CLIENT_ID` - OAuth for Gmail connections
- `GOOGLE_CLIENT_SECRET` - OAuth for Gmail connections
- `MICROSOFT_CLIENT_ID` - OAuth for Outlook connections
- `MICROSOFT_CLIENT_SECRET` - OAuth for Outlook connections

**Auto-configured (no action needed):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Rate Limits

Default Supabase limits:
- Function invocations: 500,000/month (free tier)
- Function duration: 150 seconds max
- Concurrent executions: 10 per function

Resend limits:
- Free tier: 100 emails/day
- Paid tier: Starting at 50,000 emails/month

---

## Best Practices

1. **Error Handling:** All functions use try-catch blocks
2. **Idempotency:** Functions safe to run multiple times
3. **Batch Processing:** Process in batches with limits
4. **Logging:** Log successes and failures with context
5. **CORS:** All functions have CORS headers configured
6. **Secrets:** Never log sensitive data (API keys, tokens)
7. **Timeouts:** Keep execution under 2 minutes
8. **Retries:** Implement retry logic for transient failures

---

## Future Enhancements

Potential improvements:

1. **Retry Logic:** Exponential backoff for failed notifications
2. **Dead Letter Queue:** Store permanently failed items
3. **Batch Optimization:** Process larger batches intelligently
4. **AI Parsing:** Use LLM for better email parsing
5. **Webhook Security:** Verify Resend webhook signatures
6. **Rate Limiting:** Add per-organization limits
7. **Metrics Collection:** Track detailed performance metrics
8. **Alert Aggregation:** Combine multiple alerts into digests
