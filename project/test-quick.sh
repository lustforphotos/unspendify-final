#!/bin/bash

# Quick Test Script for Unspendify
# Usage: ./test-quick.sh https://your-project.supabase.co test@mail.yourdomain.com

set -e

PROJECT_URL="${1:-}"
TEST_EMAIL="${2:-}"

if [ -z "$PROJECT_URL" ] || [ -z "$TEST_EMAIL" ]; then
  echo "❌ Usage: ./test-quick.sh <project-url> <test-email>"
  echo "   Example: ./test-quick.sh https://abc123.supabase.co test@mail.example.com"
  exit 1
fi

echo "🧪 Unspendify Quick Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📍 Project: $PROJECT_URL"
echo "📧 Test Email: $TEST_EMAIL"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH=$(curl -s "$PROJECT_URL/functions/v1/health-check")
echo "$HEALTH" | jq .

STATUS=$(echo "$HEALTH" | jq -r .status)
if [ "$STATUS" = "healthy" ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Sending Test Email"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EMAIL_RESULT=$(curl -s -X POST "$PROJECT_URL/functions/v1/inbound-email" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"email.received\",
    \"created_at\": \"$TIMESTAMP\",
    \"data\": {
      \"to\": \"$TEST_EMAIL\",
      \"from\": \"billing@testvendor.com\",
      \"subject\": \"Invoice for \$99.00 - TestVendor\",
      \"html\": \"<p>Your TestVendor subscription will renew on <strong>March 1, 2024</strong> for \$99.00/month.</p>\",
      \"text\": \"Your TestVendor subscription will renew on March 1, 2024 for \$99.00/month.\"
    }
  }")
echo "$EMAIL_RESULT" | jq .
echo "✅ Test email sent"
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Processing Emails"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PROCESS_RESULT=$(curl -s -X POST "$PROJECT_URL/functions/v1/process-emails")
echo "$PROCESS_RESULT" | jq .

PROCESSED=$(echo "$PROCESS_RESULT" | jq -r .processed)
if [ "$PROCESSED" -gt 0 ]; then
  echo "✅ Processed $PROCESSED email(s)"
else
  echo "⚠️  No emails processed (might already be processed)"
fi
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Detecting Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DETECT_RESULT=$(curl -s -X POST "$PROJECT_URL/functions/v1/detect-tools")
echo "$DETECT_RESULT" | jq .

CREATED=$(echo "$DETECT_RESULT" | jq -r .toolsCreated)
UPDATED=$(echo "$DETECT_RESULT" | jq -r .toolsUpdated)
if [ "$CREATED" -gt 0 ] || [ "$UPDATED" -gt 0 ]; then
  echo "✅ Created $CREATED tool(s), updated $UPDATED tool(s)"
else
  echo "⚠️  No tools created/updated"
fi
echo ""

sleep 2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Scheduling Notifications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SCHEDULE_RESULT=$(curl -s -X POST "$PROJECT_URL/functions/v1/schedule-notifications")
echo "$SCHEDULE_RESULT" | jq .

NOTIFICATIONS=$(echo "$SCHEDULE_RESULT" | jq -r .notificationsCreated)
echo "✅ Created $NOTIFICATIONS notification(s)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next Steps:"
echo "   1. Check Supabase dashboard to verify data:"
echo "      • raw_emails table - should have 1 new row"
echo "      • parsed_events table - should have 1 new row"
echo "      • tools table - should have 1 new row for TestVendor"
echo "      • renewals table - should have 1 new row"
echo "      • notifications table - should have notification(s)"
echo ""
echo "   2. To test email sending:"
echo "      • Update notification scheduled_for to NOW()"
echo "      • Run: curl -X POST $PROJECT_URL/functions/v1/send-notifications"
echo ""
echo "   3. View detailed logs in Supabase Dashboard:"
echo "      • Edge Functions → [function-name] → Logs"
echo ""
echo "📚 Full testing guide: TESTING.md"
