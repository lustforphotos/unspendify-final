# Testing Guide

Complete testing procedures to verify Unspendify is working correctly.

## Quick Test Overview

1. ✅ Database connectivity
2. ✅ Edge functions deployed
3. ✅ Email inbound webhook
4. ✅ Email processing pipeline
5. ✅ Tool detection
6. ✅ Notifications scheduling
7. ✅ Email delivery

## Prerequisites

- Supabase project URL
- Resend configured with webhook
- Edge functions deployed
- At least one test organization created

---

## 1. Test Database

### Check Tables Exist

```sql
-- Run in Supabase SQL Editor
SELECT
  tablename,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** 11 tables, each with 3-8 policies

### Check RLS Enabled

```sql
-- Verify RLS is enabled on all tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** All tables show `rls_enabled = true`

### Create Test Organization

```sql
-- Create test organization
INSERT INTO organizations (id, name, slug)
VALUES (
  'test-org-001',
  'Test Company',
  'test-company'
)
RETURNING *;

-- Create test user (if not using auth)
INSERT INTO users (id, email, full_name)
VALUES (
  'test-user-001',
  'admin@test.com',
  'Test Admin'
)
RETURNING *;

-- Add user as admin
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
  'test-org-001',
  'test-user-001',
  'admin'
)
RETURNING *;

-- Create inbound mailbox
INSERT INTO inbound_mailboxes (organization_id, email_address, is_active)
VALUES (
  'test-org-001',
  'test-org@mail.yourdomain.com',
  true
)
RETURNING *;
```

**Expected:** All inserts succeed, returns created records

---

## 2. Test Edge Functions

### Test Health Check

```bash
curl https://[your-project].supabase.co/functions/v1/health-check
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "database": "ok",
    "email_service": "ok"
  },
  "version": "1.0.0"
}
```

### List Deployed Functions

Check in Supabase Dashboard:
1. Navigate to Edge Functions
2. Verify 6 functions deployed:
   - ✅ inbound-email
   - ✅ process-emails
   - ✅ detect-tools
   - ✅ schedule-notifications
   - ✅ send-notifications
   - ✅ health-check

### Check Function Logs

For each function:
1. Click function name
2. Click "Logs" tab
3. Verify no errors at startup

---

## 3. Test Inbound Email

### Option A: Send Real Email

Send email from your personal email to:
```
test-org@mail.yourdomain.com
```

**Email content:**
```
From: billing@stripe.com
Subject: Invoice for $99.00
Body:
Your Stripe subscription will renew on February 1, 2024 for $99.00/month.

Thank you for your business.
```

### Option B: Test Webhook Directly

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/inbound-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.received",
    "created_at": "2024-01-01T12:00:00Z",
    "data": {
      "to": "test-org@mail.yourdomain.com",
      "from": "billing@stripe.com",
      "subject": "Invoice for $99.00 - Stripe",
      "html": "<p>Your Stripe subscription will renew on <strong>February 1, 2024</strong> for $99.00/month.</p>",
      "text": "Your Stripe subscription will renew on February 1, 2024 for $99.00/month."
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Email received and stored"
}
```

### Verify Email Stored

```sql
-- Check raw_emails table
SELECT
  id,
  from_address,
  subject,
  created_at,
  checksum
FROM raw_emails
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** New row with your test email

### Check Resend Webhook Logs

1. Go to Resend Dashboard
2. Click Webhooks
3. View recent deliveries
4. Check for 200 status code

---

## 4. Test Email Processing

### Trigger Processing Manually

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/process-emails
```

**Expected Response:**
```json
{
  "message": "Email processing complete",
  "processed": 1,
  "failed": 0,
  "total": 1
}
```

### Verify Parsed Events

```sql
-- Check parsed_events table
SELECT
  id,
  vendor_name,
  amount,
  billing_cycle,
  event_type,
  confidence_score,
  detected_renewal_date
FROM parsed_events
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- vendor_name: "Stripe"
- amount: 99.00
- billing_cycle: "monthly"
- event_type: "renewal"
- confidence_score: 80-100
- detected_renewal_date: "2024-02-01"

### Check Function Logs

```bash
# View logs in Supabase Dashboard
# Edge Functions → process-emails → Logs
```

**Look for:**
```
Processed 1 emails, 0 failed
```

---

## 5. Test Tool Detection

### Trigger Detection Manually

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/detect-tools
```

**Expected Response:**
```json
{
  "message": "Tool detection complete",
  "toolsCreated": 1,
  "toolsUpdated": 0,
  "renewalsCreated": 1,
  "eventsProcessed": 1
}
```

### Verify Tools Created

```sql
-- Check tools table
SELECT
  id,
  vendor_name,
  current_amount,
  billing_cycle,
  status,
  organization_id
FROM tools
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- vendor_name: "Stripe"
- current_amount: 99.00
- billing_cycle: "monthly"
- status: "active"
- organization_id: "test-org-001"

### Verify Renewals Created

```sql
-- Check renewals table
SELECT
  id,
  tool_id,
  renewal_date,
  amount,
  created_at
FROM renewals
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- renewal_date: "2024-02-01"
- amount: 99.00

---

## 6. Test Notification Scheduling

### Trigger Scheduler Manually

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/schedule-notifications
```

**Expected Response:**
```json
{
  "message": "Notification scheduling complete",
  "notificationsCreated": 1
}
```

### Verify Notifications Created

```sql
-- Check notifications table
SELECT
  id,
  type,
  user_id,
  tool_id,
  status,
  scheduled_for
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- type: "renewal_alert"
- user_id: "test-user-001"
- status: "pending"
- scheduled_for: Within next 30 days

### Check Recipients Logic

```sql
-- Verify correct recipients
SELECT
  n.id,
  n.type,
  u.email as recipient_email,
  om.role,
  n.scheduled_for
FROM notifications n
JOIN users u ON u.id = n.user_id
JOIN organization_members om ON om.user_id = n.user_id AND om.organization_id = n.organization_id
ORDER BY n.created_at DESC
LIMIT 10;
```

**Expected:** Admins and tool owners receive notifications

---

## 7. Test Email Sending

### Update Scheduled Time (for immediate send)

```sql
-- Set notification to send now
UPDATE notifications
SET scheduled_for = NOW() - INTERVAL '1 minute'
WHERE status = 'pending'
LIMIT 1
RETURNING id, scheduled_for;
```

### Trigger Email Sending

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/send-notifications
```

**Expected Response:**
```json
{
  "message": "Notification sending complete",
  "sent": 1,
  "failed": 0,
  "total": 1
}
```

### Verify Notification Status

```sql
-- Check notification was marked as sent
SELECT
  id,
  type,
  status,
  sent_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:**
- status: "sent"
- sent_at: Current timestamp

### Check Email Inbox

Check the email inbox for `admin@test.com`:

**Expected Email:**
- Subject: "Stripe renews on February 1, 2024"
- Contains renewal date
- Contains amount ($99.00)
- Has "View Dashboard" CTA button

### Check Resend Delivery

1. Go to Resend Dashboard
2. Click Emails
3. Find recent email
4. Verify status: "Delivered"

---

## 8. Test Full Pipeline End-to-End

### Complete Flow Test

1. **Send Test Email**
   ```bash
   # Send to: test-org@mail.yourdomain.com
   # Subject: "Slack invoice - $100/month"
   # Body: "Your Slack workspace will renew on March 15, 2024 for $100"
   ```

2. **Wait 5 minutes** (for process-emails cron)

3. **Check Parsed Events**
   ```sql
   SELECT * FROM parsed_events
   WHERE vendor_name ILIKE '%slack%'
   ORDER BY created_at DESC LIMIT 1;
   ```

4. **Wait 10 minutes** (for detect-tools cron)

5. **Check Tools**
   ```sql
   SELECT * FROM tools
   WHERE vendor_name ILIKE '%slack%'
   ORDER BY created_at DESC LIMIT 1;
   ```

6. **Manually Trigger Scheduler**
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/schedule-notifications
   ```

7. **Check Notification Created**
   ```sql
   SELECT * FROM notifications
   WHERE tool_id = (SELECT id FROM tools WHERE vendor_name ILIKE '%slack%')
   ORDER BY created_at DESC LIMIT 1;
   ```

8. **Trigger Sending**
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/send-notifications
   ```

9. **Verify Email Received**
   - Check inbox for renewal alert

**Total Time:** ~15 minutes with cron waits, or ~2 minutes with manual triggers

---

## 9. Test RLS Policies

### Test Organization Isolation

```sql
-- Create second organization
INSERT INTO organizations (id, name, slug)
VALUES ('test-org-002', 'Company Two', 'company-two');

-- Try to access org-001's tools as org-002 admin
-- This should return empty (RLS blocks it)
SET request.jwt.claims.org_id = 'test-org-002';
SELECT * FROM tools WHERE organization_id = 'test-org-001';
```

**Expected:** No rows returned (RLS blocks cross-org access)

### Test Admin vs Member Permissions

```sql
-- Create member user
INSERT INTO users (id, email, full_name)
VALUES ('test-member-001', 'member@test.com', 'Test Member');

INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('test-org-001', 'test-member-001', 'member');

-- Members can read tools but not assign owners
-- Test this from application layer
```

---

## 10. Test Cron Schedules

### Verify Cron Configuration

Check in Supabase Dashboard:
1. Edge Functions → Cron
2. Verify schedules:
   - ✅ process-emails: `*/5 * * * *`
   - ✅ detect-tools: `*/10 * * * *`
   - ✅ schedule-notifications: `0 8 * * *`
   - ✅ send-notifications: `*/15 * * * *`

### Monitor Cron Execution

```bash
# Check logs for automatic execution
# Dashboard → Edge Functions → [function-name] → Logs
# Filter by: last 1 hour
```

**Look for:**
- Regular execution every N minutes
- Success messages
- No error patterns

---

## Common Issues & Solutions

### Issue: Email Not Received

**Check:**
1. Resend webhook configured correctly
2. Mailbox email address matches
3. inbound-email function logs for errors
4. Resend webhook delivery logs

**Solution:**
```bash
# Test webhook directly
curl -X POST https://[project].supabase.co/functions/v1/inbound-email \
  -H "Content-Type: application/json" \
  -d '{"type":"email.received","created_at":"2024-01-01T00:00:00Z","data":{"to":"test@mail.domain.com","from":"test@example.com","subject":"Test","html":"Test"}}'
```

### Issue: Parsing Failed (Low Confidence)

**Check:**
```sql
SELECT * FROM parsed_events
WHERE confidence_score < 50
ORDER BY created_at DESC LIMIT 10;
```

**Solution:** Improve email content with clear vendor, amount, date

### Issue: Tool Not Created

**Check:**
```sql
-- Find events not linked to tools
SELECT pe.*
FROM parsed_events pe
LEFT JOIN tools t ON t.last_event_id = pe.id
WHERE t.id IS NULL
AND pe.confidence_score >= 50;
```

**Solution:** Manually trigger detect-tools

### Issue: Notification Not Sent

**Check:**
```sql
SELECT * FROM notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

**Solution:**
1. Verify RESEND_API_KEY set
2. Check Resend API key valid
3. Review send-notifications logs

### Issue: RLS Denying Access

**Check:**
```sql
-- View user's organization memberships
SELECT * FROM organization_members
WHERE user_id = 'user-id';

-- Check if RLS helper function works
SELECT is_admin('org-id');
```

**Solution:** Ensure user is member of organization

---

## Performance Testing

### Load Test Email Processing

```bash
# Send 10 test emails
for i in {1..10}; do
  curl -X POST https://[project].supabase.co/functions/v1/inbound-email \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"email.received\",\"created_at\":\"2024-01-01T00:00:00Z\",\"data\":{\"to\":\"test@mail.domain.com\",\"from\":\"vendor${i}@example.com\",\"subject\":\"Invoice $${i}00\",\"html\":\"Renewal for $${i}00\"}}"
done

# Process batch
curl -X POST https://[project].supabase.co/functions/v1/process-emails

# Check processing time in logs
```

**Expected:** <5 seconds for 10 emails

### Monitor Database Performance

```sql
-- Check slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Automated Test Script

Save as `test.sh`:

```bash
#!/bin/bash

PROJECT_URL="https://[your-project].supabase.co"
TEST_EMAIL="test-org@mail.yourdomain.com"

echo "🧪 Testing Unspendify..."

echo "\n1. Testing health check..."
curl -s "$PROJECT_URL/functions/v1/health-check" | jq .

echo "\n2. Sending test email..."
curl -s -X POST "$PROJECT_URL/functions/v1/inbound-email" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"email.received\",\"created_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"data\":{\"to\":\"$TEST_EMAIL\",\"from\":\"billing@testvendor.com\",\"subject\":\"Invoice for \$99\",\"html\":\"<p>Renewal on 2024-03-01 for \$99</p>\"}}" | jq .

echo "\n3. Processing emails..."
sleep 2
curl -s -X POST "$PROJECT_URL/functions/v1/process-emails" | jq .

echo "\n4. Detecting tools..."
sleep 2
curl -s -X POST "$PROJECT_URL/functions/v1/detect-tools" | jq .

echo "\n5. Scheduling notifications..."
sleep 2
curl -s -X POST "$PROJECT_URL/functions/v1/schedule-notifications" | jq .

echo "\n✅ Test complete! Check database for results."
```

Run with:
```bash
chmod +x test.sh
./test.sh
```

---

## Test Checklist

Use this checklist to verify everything:

- [ ] Database tables exist (11 total)
- [ ] RLS enabled on all tables
- [ ] Test organization created
- [ ] Inbound mailbox created
- [ ] Health check returns healthy
- [ ] All 6 edge functions deployed
- [ ] Test email received and stored
- [ ] Email parsed into event
- [ ] Tool created from event
- [ ] Renewal record created
- [ ] Notification scheduled
- [ ] Notification sent successfully
- [ ] Email delivered to inbox
- [ ] RLS policies block cross-org access
- [ ] Cron jobs configured
- [ ] Function logs show no errors

**Status: Ready for Production** when all items checked ✅
