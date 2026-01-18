# Deployment Checklist

Complete this checklist before deploying Unspendify to production.

## Pre-Deployment

### Environment Setup

- [ ] Copy `.env.example` to `.env` and fill in all values
- [ ] Set `VITE_SUPABASE_URL` from Supabase project settings
- [ ] Set `VITE_SUPABASE_ANON_KEY` from Supabase project settings
- [ ] Verify `NODE_ENV=production` for production build

### Supabase Configuration

- [ ] Supabase project created and active
- [ ] Database migrations applied (2 migrations total)
- [ ] Verify all tables exist with RLS enabled
- [ ] Service role key available for edge functions

### Email Service Setup

- [ ] Resend account created at https://resend.com
- [ ] API key generated with full access
- [ ] Set `RESEND_API_KEY` in Supabase secrets
- [ ] Domain added in Resend dashboard
- [ ] DNS records verified (MX, TXT, SPF, DKIM)
- [ ] Inbound email domain configured (e.g., mail.yourdomain.com)
- [ ] Test email sent and received successfully

### Edge Functions

- [ ] `inbound-email` function deployed
- [ ] `process-emails` function deployed
- [ ] `detect-tools` function deployed
- [ ] `schedule-notifications` function deployed
- [ ] `send-notifications` function deployed
- [ ] `health-check` function deployed

### Webhooks

- [ ] Resend webhook URL configured: `https://[project].supabase.co/functions/v1/inbound-email`
- [ ] Webhook event type set to `email.received`
- [ ] Webhook tested with sample email

### Cron Jobs

Configure in Supabase Dashboard → Edge Functions → Cron:

- [ ] `process-emails` - Every 5 minutes: `*/5 * * * *`
- [ ] `detect-tools` - Every 10 minutes: `*/10 * * * *`
- [ ] `schedule-notifications` - Daily at 8am UTC: `0 8 * * *`
- [ ] `send-notifications` - Every 15 minutes: `*/15 * * * *`

## Database Verification

### Tables

- [ ] `organizations` - Exists with RLS
- [ ] `users` - Exists with RLS
- [ ] `organization_members` - Exists with RLS
- [ ] `inbound_mailboxes` - Exists with RLS
- [ ] `raw_emails` - Exists with RLS
- [ ] `parsed_events` - Exists with RLS
- [ ] `tools` - Exists with RLS
- [ ] `tool_ownership` - Exists with RLS
- [ ] `renewals` - Exists with RLS
- [ ] `notifications` - Exists with RLS
- [ ] `notification_preferences` - Exists with RLS

### Indexes

- [ ] Foreign key indexes created
- [ ] Date column indexes created
- [ ] Email address indexes created
- [ ] Organization ID indexes created

### Functions

- [ ] `is_admin(org_id)` helper function exists

## Security Verification

### Row Level Security

- [ ] All tables have RLS enabled
- [ ] Organization isolation policies work correctly
- [ ] Admin policies restrict to admin role
- [ ] Member policies allow read access
- [ ] Tool ownership policies admin-only for INSERT/UPDATE/DELETE

### Secrets Management

- [ ] `SUPABASE_SERVICE_ROLE_KEY` kept secret (not in frontend)
- [ ] `RESEND_API_KEY` stored as Supabase secret (not committed)
- [ ] No API keys in git repository
- [ ] `.env` file in `.gitignore`

### API Security

- [ ] CORS headers configured on all edge functions
- [ ] JWT verification enabled on protected functions
- [ ] Rate limiting considered for public endpoints
- [ ] Input validation on all edge function parameters

## Frontend Deployment

### Build

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No linting errors: `npm run lint`
- [ ] Bundle size acceptable (check dist folder)

### Hosting

- [ ] Frontend deployed to hosting provider
- [ ] Custom domain configured
- [ ] HTTPS/SSL certificate active
- [ ] Environment variables set in hosting provider

### Testing

- [ ] Homepage loads correctly
- [ ] Navigation works across all pages
- [ ] Responsive design works on mobile
- [ ] Forms submit correctly

## Testing Checklist

### Email Pipeline

- [ ] Send test email to inbound mailbox
- [ ] Verify email stored in `raw_emails` table
- [ ] Check `process-emails` creates `parsed_events`
- [ ] Verify `detect-tools` creates tool record
- [ ] Confirm tool appears in database

### Authentication

- [ ] User registration works
- [ ] User login works
- [ ] Session persistence works
- [ ] Logout works correctly
- [ ] Password reset flow (if implemented)

### Organization & Roles

- [ ] Create test organization
- [ ] Add admin user
- [ ] Add member user
- [ ] Verify admin can manage members
- [ ] Verify member cannot manage members
- [ ] Test data isolation between organizations

### Notifications

- [ ] Create test renewal record
- [ ] Run `schedule-notifications` manually
- [ ] Verify notification created in database
- [ ] Run `send-notifications` manually
- [ ] Confirm email delivered to inbox
- [ ] Check notification marked as sent

### Permissions

- [ ] Admin can assign tool owners
- [ ] Member cannot assign tool owners
- [ ] Tool owner receives alerts
- [ ] Non-owner member does not receive alerts (unless opted in)

## Monitoring Setup

### Health Checks

- [ ] Health check endpoint accessible: `/functions/v1/health-check`
- [ ] Returns 200 status when healthy
- [ ] Database check passes
- [ ] Email service check passes

### Logging

- [ ] Edge function logs accessible in Supabase dashboard
- [ ] Error logs being captured
- [ ] Webhook logs visible in Resend dashboard

### Alerts

- [ ] Set up uptime monitoring (optional: UptimeRobot, Pingdom)
- [ ] Configure alerts for edge function failures
- [ ] Monitor database query performance
- [ ] Track notification delivery rates

### Metrics to Monitor

- [ ] Emails received per day
- [ ] Email parsing success rate
- [ ] Tools detected per week
- [ ] Notifications sent per day
- [ ] Notification delivery success rate
- [ ] Database connection pool usage
- [ ] API response times

## Performance Optimization

- [ ] Database indexes verified
- [ ] Edge function cold start times acceptable
- [ ] Frontend bundle optimized and minified
- [ ] Images optimized (using Pexels URLs)
- [ ] No unnecessary re-renders in React

## Backup & Recovery

- [ ] Supabase automatic backups enabled (7-day retention)
- [ ] Manual backup taken before deployment
- [ ] Recovery procedure documented
- [ ] Rollback plan prepared

## Documentation

- [ ] README updated with deployment instructions
- [ ] SECURITY.md explains permissions model
- [ ] DEPLOYMENT.md provides full deployment guide
- [ ] API documentation created (if public API)
- [ ] User guide written (if applicable)

## Post-Deployment

### Immediate Verification (Within 1 hour)

- [ ] Health check returns healthy status
- [ ] Send test email and verify full pipeline
- [ ] Create test user and organization
- [ ] Verify no errors in edge function logs

### Short-term Monitoring (Within 24 hours)

- [ ] Check cron jobs executing on schedule
- [ ] Monitor error rates in logs
- [ ] Verify notifications sending correctly
- [ ] Check database performance metrics

### Long-term Monitoring (Within 1 week)

- [ ] Review email parsing accuracy
- [ ] Monitor notification delivery rates
- [ ] Check for any security issues
- [ ] Gather user feedback
- [ ] Optimize slow queries if found

## Rollback Plan

If critical issues occur:

1. [ ] Revert frontend deployment to previous version
2. [ ] Roll back database migrations if needed
3. [ ] Redeploy previous edge function versions
4. [ ] Verify rollback successful
5. [ ] Investigate root cause
6. [ ] Fix issues in development
7. [ ] Redeploy with fixes

## Sign-Off

- [ ] All critical items completed
- [ ] Testing passed
- [ ] Security verified
- [ ] Monitoring active
- [ ] Documentation complete

**Deployed by:** _______________

**Date:** _______________

**Version:** _______________

**Notes:**

---

## Quick Reference

### Supabase Project URLs

- Dashboard: `https://supabase.com/dashboard/project/[project-id]`
- API URL: `https://[project-id].supabase.co`
- Edge Functions: `https://[project-id].supabase.co/functions/v1`

### Key Commands

```bash
# Build frontend
npm run build

# Type check
npm run typecheck

# Lint code
npm run lint

# Test health endpoint
curl https://[project].supabase.co/functions/v1/health-check

# Manually trigger workers
curl -X POST https://[project].supabase.co/functions/v1/process-emails
curl -X POST https://[project].supabase.co/functions/v1/detect-tools
curl -X POST https://[project].supabase.co/functions/v1/schedule-notifications
curl -X POST https://[project].supabase.co/functions/v1/send-notifications
```

### Support Contacts

- Supabase Support: https://supabase.com/support
- Resend Support: https://resend.com/support
- Internal Team: [Your contact info]
