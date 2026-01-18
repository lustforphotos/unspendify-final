# Deployment Guide

Complete guide for deploying Unspendify to production.

## Prerequisites

- Supabase project (already provisioned)
- Resend account for email handling
- Domain for inbound emails
- Node.js 18+ for local development

## Environment Variables

### Frontend Variables (Vite)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend Variables (Edge Functions)

These are automatically available in Supabase Edge Functions:

```bash
SUPABASE_URL=auto-populated
SUPABASE_ANON_KEY=auto-populated
SUPABASE_SERVICE_ROLE_KEY=auto-populated
```

### Custom Secrets (Set via Supabase)

```bash
# Set via: supabase secrets set RESEND_API_KEY=your_key
RESEND_API_KEY=re_your_api_key
INBOUND_EMAIL_DOMAIN=mail.yourdomain.com
APP_URL=https://yourdomain.com
```

**Important:** Never commit `.env` file. Use `.env.example` as template.

## Database Setup

### 1. Run Migrations

Migrations are already created. Apply them:

```bash
# Migration 1: Core schema
supabase/migrations/20251223143700_create_unspendify_schema.sql

# Migration 2: Security permissions
supabase/migrations/20251223162403_add_security_permissions.sql
```

Both migrations are idempotent and safe to run multiple times.

### 2. Verify Tables

Check that all tables exist:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected tables:
- organizations
- users
- organization_members
- inbound_mailboxes
- raw_emails
- parsed_events
- tools
- tool_ownership
- renewals
- notifications
- notification_preferences

## Inbound Email Setup

### Using Resend

1. **Get Resend API Key**
   - Sign up at https://resend.com
   - Create API key with full access
   - Save as `RESEND_API_KEY` secret

2. **Configure Inbound Domain**
   - Add your domain in Resend dashboard
   - Verify DNS records (MX, TXT)
   - Domain should be `mail.yourdomain.com`

3. **Set Webhook URL**
   - Deploy `inbound-email` edge function first
   - Webhook URL: `https://your-project.supabase.co/functions/v1/inbound-email`
   - Add webhook in Resend dashboard

4. **Test Email Receipt**
   - Send test email to `test@mail.yourdomain.com`
   - Check raw_emails table for new record
   - Verify webhook logs in Resend dashboard

### Email Flow

```
External Email → Resend → Edge Function → raw_emails table → Background Worker
```

## Edge Functions Deployment

### Required Functions

1. **inbound-email** - Receives and stores incoming emails
2. **process-emails** - Parses raw emails into events
3. **detect-tools** - Creates tools from parsed events
4. **schedule-notifications** - Creates notification records
5. **send-notifications** - Sends pending notifications
6. **health-check** - Monitoring endpoint

### Deploy All Functions

Functions must be deployed individually with proper configurations.

### Cron Schedule Setup

Configure cron jobs in Supabase dashboard:

```bash
# Process emails every 5 minutes
*/5 * * * * - process-emails

# Detect new tools every 10 minutes
*/10 * * * * - detect-tools

# Schedule notifications daily at 8am UTC
0 8 * * * - schedule-notifications

# Send notifications every 15 minutes
*/15 * * * * - send-notifications
```

## Background Workers

### Worker 1: Email Parser

**Function:** `process-emails`
**Schedule:** Every 5 minutes
**Task:** Parse raw_emails → parsed_events

Logic:
1. Fetch unprocessed raw_emails
2. Extract vendor, amount, date, event type
3. Insert into parsed_events
4. Mark email as processed (via tracking or timestamp)

### Worker 2: Tool Detector

**Function:** `detect-tools`
**Schedule:** Every 10 minutes
**Task:** parsed_events → tools

Logic:
1. Fetch new parsed_events
2. Match to existing tools or create new
3. Update tool amounts and status
4. Create renewal records

### Worker 3: Notification Scheduler

**Function:** `schedule-notifications`
**Schedule:** Daily at 8am UTC
**Task:** Check upcoming renewals, create notifications

Logic:
1. Find renewals in next 30 days
2. Create notification records for 30d, 14d, 7d before
3. Check for trial endings
4. Respect user preferences and roles

### Worker 4: Notification Sender

**Function:** `send-notifications`
**Schedule:** Every 15 minutes
**Task:** Send pending notifications via Resend

Logic:
1. Fetch pending notifications where scheduled_for <= now
2. Send via Resend API
3. Mark as sent or failed
4. Retry failed notifications (with backoff)

## Monitoring Setup

### Health Check Endpoint

`GET /functions/v1/health-check`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": "ok",
    "email_service": "ok"
  }
}
```

### Database Monitoring

Supabase provides built-in monitoring:
- Query performance
- Connection pooling
- Disk usage
- Error logs

Access via: Supabase Dashboard → Reports

### Error Tracking

Monitor edge function logs:
- Supabase Dashboard → Edge Functions → Logs
- Filter by function name
- Check for 4xx/5xx responses
- Set up alerts for critical errors

### Key Metrics

Track these metrics:

1. **Email Processing**
   - Emails received per day
   - Parsing success rate
   - Average processing time

2. **Notifications**
   - Notifications sent per day
   - Delivery success rate
   - Failed notification count

3. **Database**
   - Query response time
   - Connection count
   - Table sizes

4. **User Activity**
   - Active organizations
   - Daily active users
   - New subscriptions detected

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key kept secret (never in frontend)
- [ ] API keys stored as Supabase secrets
- [ ] CORS configured on edge functions
- [ ] HTTPS enforced everywhere
- [ ] Input validation on all endpoints
- [ ] Rate limiting on public endpoints

## Performance Optimization

### Database Indexes

All necessary indexes are created in migrations:
- Foreign key columns
- Frequently queried columns (email, org_id)
- Date columns for sorting

### Edge Function Optimization

- Keep functions small and focused
- Use connection pooling for database
- Cache static data where possible
- Set appropriate timeouts

### Frontend Optimization

- Code splitting by route
- Lazy load heavy components
- Optimize images (use Pexels URLs)
- Minify and compress assets

## Backup Strategy

### Database Backups

Supabase automatic backups:
- Daily backups (retained 7 days)
- Point-in-time recovery
- Manual backups before major changes

### Data Export

Regular exports for compliance:
```sql
-- Export all organization data
SELECT * FROM tools WHERE organization_id = 'org-id';
SELECT * FROM raw_emails WHERE inbound_mailbox_id IN (...);
```

## Rollback Plan

### Database Rollback

Create down migrations for each schema change:
1. Test migration on staging
2. Back up production database
3. Apply migration
4. Monitor for errors
5. Rollback if issues detected

### Function Rollback

Keep previous function versions:
1. Tag deployments with version
2. Keep last 3 versions
3. Redeploy previous version if needed

## Post-Deployment Verification

1. **Database Connection**
   ```bash
   curl https://your-project.supabase.co/rest/v1/
   ```

2. **Authentication**
   - Sign up new user
   - Verify email flow
   - Test login/logout

3. **Email Inbound**
   - Send test email
   - Check raw_emails table
   - Verify parsing worked

4. **Notifications**
   - Trigger test notification
   - Verify email delivery
   - Check notification status

5. **RLS Policies**
   - Create test organization
   - Verify data isolation
   - Test admin vs member permissions

## Troubleshooting

### Emails Not Receiving

1. Check Resend webhook logs
2. Verify DNS records for mail domain
3. Test inbound-email function directly
4. Check edge function logs

### Notifications Not Sending

1. Verify RESEND_API_KEY is set
2. Check notifications table status
3. Review send-notifications logs
4. Test Resend API directly

### RLS Policy Errors

1. Check user's organization membership
2. Verify auth.uid() returns correct ID
3. Review policy logic
4. Test policies with different roles

### Performance Issues

1. Check slow query log
2. Verify indexes are being used
3. Monitor connection pool
4. Check edge function timeouts

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- Edge Functions: https://supabase.com/docs/guides/functions
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
